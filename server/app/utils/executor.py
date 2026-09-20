"""
Shared ThreadPoolExecutor used to keep the event loop responsive while we do
CPU-bound work: parsing large .xlsx files (pandas/openpyxl) and hashing
student passwords (bcrypt) during bulk uploads. Both question uploads and
student bulk-registration route their heavy lifting through this pool via
`loop.run_in_executor(...)` instead of doing it inline on the event loop.
"""
import os
from concurrent.futures import ThreadPoolExecutor

# A little more generous than "cpu_count" because this work is a mix of
# I/O (openpyxl/pandas reading bytes) and CPU (bcrypt hashing), so threads
# spend some of their time blocked rather than fully saturating a core.
MAX_WORKERS = min(32, (os.cpu_count() or 4) * 4)

upload_executor = ThreadPoolExecutor(
    max_workers=MAX_WORKERS,
    thread_name_prefix="cbx-upload-worker",
)
