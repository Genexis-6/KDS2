import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import select

from ...dependecy import AsyncSession
from ...models import SessionModel


class SessionQueries:
    """
    Enforces: one student -> one active session at a time.

    A session is created at login and is destroyed (is_active=False) when:
      - the student explicitly logs out
      - it naturally expires (same lifetime as their refresh token)
      - their refresh token is rejected (see token_generator.refresh_access_token)
      - an admin force-clears it
    Submitting or timing out of an exam does NOT end the session.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_session(self, student_id: UUID) -> Optional[SessionModel]:
        if isinstance(student_id, str):
            try:
                student_id = UUID(student_id)
            except ValueError:
                return None

        res = await self.session.execute(
            select(SessionModel).where(SessionModel.student_id == student_id)
        )
        return res.scalar_one_or_none()

    async def has_active_session(self, student_id: UUID) -> bool:
        row = await self.get_session(student_id)
        if not row or not row.is_active:
            return False

        if row.expires_at < datetime.utcnow():
            # Expired naturally - free it up rather than block the student forever.
            row.is_active = False
            await self.session.commit()
            return False

        return True

    async def start_session(self, student_id: UUID, ttl: timedelta) -> str:
        """
        Creates (or re-activates) the single session row for this student.
        Caller is expected to have already checked `has_active_session` is False.
        """
        token = secrets.token_hex(32)
        now = datetime.utcnow()

        existing = await self.get_session(student_id)
        if existing:
            existing.session_token = token
            existing.is_active = True
            existing.created_at = now
            existing.last_seen_at = now
            existing.expires_at = now + ttl
        else:
            self.session.add(
                SessionModel(
                    id=uuid4(),
                    student_id=student_id,
                    session_token=token,
                    is_active=True,
                    created_at=now,
                    last_seen_at=now,
                    expires_at=now + ttl,
                )
            )

        await self.session.commit()
        return token

    async def is_session_valid(self, student_id: UUID, token: str) -> bool:
        row = await self.get_session(student_id)
        if not row or not row.is_active or row.session_token != token:
            return False

        if row.expires_at < datetime.utcnow():
            row.is_active = False
            await self.session.commit()
            return False

        row.last_seen_at = datetime.utcnow()
        await self.session.commit()
        return True

    async def end_session(self, student_id: UUID) -> bool:
        if isinstance(student_id, str):
            try:
                student_id = UUID(student_id)
            except ValueError:
                return False
    
        row = await self.get_session(student_id)
    
        if not row or not row.is_active:
            return False
    
        row.is_active = False
        await self.session.commit()
        return True

    async def end_session_if_token(self, student_id: UUID, token: str) -> bool:
        """
        Like `end_session`, but only if `token` is the session token currently
        on record. Used when a dead JWT is what triggers the teardown: a stale
        token from an older login must not end the student's newer session.
        """
        if isinstance(student_id, str):
            try:
                student_id = UUID(student_id)
            except ValueError:
                return False

        row = await self.get_session(student_id)

        if not row or not row.is_active or row.session_token != token:
            return False

        row.is_active = False
        await self.session.commit()
        return True
