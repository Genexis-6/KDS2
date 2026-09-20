
from app.utils.enums.class_room_enums import ClassRoomEnums
from app.repo.schemas.student_schemas.add_new_student_schemas import AddNewStudentSchemas
from app.utils.enums.auth_enums import AuthEums
from app.security.password_hasher import generate_password, verify_hash_password
from app.repo.schemas.login_schemas import LoginUserSchemas
from app.repo import db_session_manager
from app.utils.executor import upload_executor
from app.utils.job_tracker import upload_job_tracker
import openpyxl
import asyncio
import io
from ...dependecy import AsyncSession
from sqlalchemy import select
from ...models import StudentsModel, AdminModel

from uuid import UUID, uuid4

# Students committed per DB transaction during a bulk upload (also the progress granularity).
SAVE_CHUNK_SIZE = 100



class AuthQueries:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def check_student_exist(self, identifier: str):
        res = await self.session.execute(select(StudentsModel).where(StudentsModel.identifier == identifier))
        output = res.scalar_one_or_none()
        return output
        
    async def check_admin_exist(self, identifier: str):
        res = await self.session.execute(select(AdminModel).where(AdminModel.identifier == identifier))
        output = res.scalar_one_or_none()
        return output

    
    async def add_new_student(self, add:AddNewStudentSchemas):
        check = await self.check_student_exist(add.identifier)
        if check:
            return AuthEums.EXISTS
        self.session.add(
            StudentsModel(
               id=uuid4(),
               class_id=add.class_id,
               full_name=add.full_name,
               identifier=add.identifier,
               password = generate_password(add.password)
            )
        )
        await self.session.commit()
        return AuthEums.CREATED
    
    
    
    async def login_user(self, login: LoginUserSchemas):
        if login.role == "admin":
            user = await self.check_admin_exist(identifier=login.identifier)
        else:
            user = await self.check_student_exist(login.identifier)
        if user:
            if verify_hash_password(login.password, hash_pass=user.password):
                return user
            return AuthEums.NOT_ALLOWED
        return AuthEums.NOT_FOUND

    async def process_bulk_students(self, file, class_id: str, job_id: str = None):
        """
        Runs (via BackgroundTasks) after the request has already returned 202.
        The heavy parts -- reading the .xlsx with openpyxl and hashing every
        student's password with bcrypt -- are CPU-bound, so they're pushed
        onto the shared worker thread pool instead of running inline on the
        event loop, where they'd stall every other request being served
        while a big roster uploads.

        If `job_id` is given, progress is written to `upload_job_tracker`, which
        pushes it to the admin's browser over the WebSocket `/ws/jobs/{job_id}`
        (`/auth/register/bulk/status/{job_id}` still works as a polling fallback).
        """
        saved = 0  # students actually committed to the DB so far

        def set_job(**kwargs):
            # Goes through the tracker (not setattr) so open WebSockets get pushed the change.
            if job_id:
                upload_job_tracker.update(job_id, **kwargs)

        try:
            set_job(status="parsing", message="Reading the Excel file...")
            contents = file.file.read()
            loop = asyncio.get_running_loop()

            def parse_workbook(data: bytes):
                workbook = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
                sheet = workbook.active
                parsed = []
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not row or len(row) < 2:
                        continue
                    full_name, identifier = row[0], row[1]
                    if not full_name or not identifier:
                        continue
                    parsed.append((str(full_name).strip(), str(identifier).strip()))
                return parsed

            parsed_rows = await loop.run_in_executor(upload_executor, parse_workbook, contents)
            if not parsed_rows:
                set_job(status="error", error="No valid rows found in the file.", message="No valid rows found.")
                return AuthEums.ERROR

            set_job(total=len(parsed_rows), message=f"Checking {len(parsed_rows)} rows against existing students...")

            # One query to find which identifiers already exist, instead of a
            # per-row SELECT.
            identifiers = [identifier for _, identifier in parsed_rows]
            existing_res = await self.session.execute(
                select(StudentsModel.identifier).where(StudentsModel.identifier.in_(identifiers))
            )
            existing = {row[0] for row in existing_res.all()}

            rows_to_create = []
            seen = set()
            skipped = 0
            for full_name, identifier in parsed_rows:
                if identifier in existing or identifier in seen:
                    skipped += 1
                    continue
                seen.add(identifier)
                rows_to_create.append((full_name, identifier))

            set_job(skipped=skipped)

            if not rows_to_create:
                set_job(status="done", processed=len(parsed_rows), message="Nothing new to add -- every identifier already existed.")
                return AuthEums.OK

            # bcrypt hashing is CPU-bound and releases the GIL while it runs, so
            # fanning the hashes out across the thread pool gives real wall-clock
            # speedup for a roster of hundreds of students, instead of hashing
            # one password at a time on the event loop. We track each hash as
            # it completes (rather than a single gather()) so the progress bar
            # actually moves during this, the slowest phase of the whole job.
            set_job(status="hashing", message=f"Creating accounts for {len(rows_to_create)} students...")

            passwords = [full_name.strip().split(" ")[0].strip().lower() for full_name, _ in rows_to_create]
            indexed_futures = [
                loop.run_in_executor(upload_executor, generate_password, pwd)
                for pwd in passwords
            ]
            hashed_by_index = [None] * len(passwords)
            for i, future in enumerate(indexed_futures):
                hashed_by_index[i] = await future
                set_job(processed=i + 1)

            new_students = [
                StudentsModel(
                    id=uuid4(),
                    class_id=UUID(class_id),
                    full_name=full_name,
                    identifier=identifier,
                    password=hashed,
                )
                for (full_name, identifier), hashed in zip(rows_to_create, hashed_by_index)
            ]

            # Save in chunks, committing each, so `created` is a true count of
            # students already in the database and the progress bar shows real
            # saves. If something fails part-way, the chunks already committed
            # stay, and re-uploading the same file is safe: existing identifiers
            # are skipped.
            set_job(status="saving", created=0, message=f"Saving {len(new_students)} students...")
            for start in range(0, len(new_students), SAVE_CHUNK_SIZE):
                chunk = new_students[start:start + SAVE_CHUNK_SIZE]
                self.session.add_all(chunk)
                await self.session.commit()
                saved += len(chunk)
                set_job(created=saved, message=f"Saved {saved} of {len(new_students)} students...")

            set_job(
                status="done",
                created=saved,
                processed=len(parsed_rows),
                message=f"Done -- {saved} students added"
                + (f", {skipped} skipped (already existed)." if skipped else "."),
            )
            return AuthEums.OK

        except Exception as e:
            await self.session.rollback()
            print("process_bulk_students error:", e)
            if saved:
                set_job(
                    status="error",
                    error=str(e),
                    message=f"Stopped after saving {saved} students. Upload the same file again to "
                            f"finish -- students who were already saved are skipped.",
                )
            else:
                set_job(status="error", error=str(e), message="Something went wrong during the upload.")
            return AuthEums.ERROR