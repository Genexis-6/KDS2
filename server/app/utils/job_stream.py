"""
The WebSocket streaming loop, kept free of any FastAPI types so it can be
tested with plain fakes. The route (routes/jobs/job_progress.py) supplies the
real socket's send / disconnect-detection.
"""
import asyncio
from typing import Awaitable, Callable

from app.utils.job_tracker import JobTracker, UploadJob, TERMINAL_STATUSES

# Never send faster than this: a 1500-student upload updates many times per
# second and the browser only needs a smooth bar, not every single tick.
DEFAULT_MIN_INTERVAL_SECONDS = 0.1


async def stream_job(
    job: UploadJob,
    tracker: JobTracker,
    send_json: Callable[[dict], Awaitable[None]],
    wait_disconnect: Callable[[], Awaitable[None]],
    min_interval: float = DEFAULT_MIN_INTERVAL_SECONDS,
) -> None:
    """
    Sends the job's current state immediately (so a client that connects late
    still sees where it is), then again after every change, until the job is
    done/errored or the client goes away.
    """
    sub = tracker.subscribe(job.id)
    gone = asyncio.ensure_future(wait_disconnect())
    try:
        while True:
            # Clear BEFORE reading the snapshot: an update that lands while we
            # are sending re-sets the event, so it can never be missed.
            sub.clear()
            snapshot = job.as_dict()
            await send_json(snapshot)
            # Judge the snapshot we actually SENT, not the live job: if the job
            # finished while we were sending, the event is already set and the
            # next loop iteration delivers the final state.
            if snapshot["status"] in TERMINAL_STATUSES:
                return

            changed = asyncio.ensure_future(sub.wait())
            done, _ = await asyncio.wait({changed, gone}, return_when=asyncio.FIRST_COMPLETED)
            if gone in done:
                changed.cancel()
                return

            if min_interval:
                await asyncio.sleep(min_interval)
    finally:
        gone.cancel()
        sub.close()
