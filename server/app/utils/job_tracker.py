"""
Minimal in-memory progress tracker for background jobs (bulk student
registration and question uploads from Excel). Not meant to survive a server
restart or scale across multiple worker processes -- this app runs as a single
process, so a plain dict is enough, and much simpler than standing up
Redis/Celery for what is essentially a progress bar.

Progress is pushed to the browser over a WebSocket (routes/jobs/job_progress.py).
Each open socket holds a JobSubscription; `update()` wakes it up and the socket
sends the job's *latest* state. Because sockets always send the latest snapshot
(never a queue of old ones), a burst of fast updates collapses into one message
instead of piling up behind a slow client.

All update() calls must happen on the event loop (they do: the background job
coroutines run there, and only the CPU-heavy parts go to worker threads).
"""
import asyncio
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Set
from uuid import uuid4

TERMINAL_STATUSES = ("done", "error")


@dataclass
class UploadJob:
    id: str
    kind: str = "students"        # "students" | "questions"
    owner_id: Optional[str] = None  # admin who started it; only they can watch it
    status: str = "pending"       # pending -> parsing -> hashing -> saving -> done | error
    total: int = 0
    processed: int = 0            # rows finished with the current phase
    created: int = 0              # rows actually SAVED to the database
    skipped: int = 0
    percent: int = 0              # 0-100, never goes backwards
    message: str = "Starting..."
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)

    def as_dict(self):
        return {
            "jobId": self.id,
            "kind": self.kind,
            "status": self.status,
            "total": self.total,
            "processed": self.processed,
            "created": self.created,
            "skipped": self.skipped,
            "percent": self.percent,
            "message": self.message,
            "error": self.error,
        }


def _compute_percent(job: UploadJob) -> int:
    """Where the bar should be, based on phase + counters."""
    if job.status == "done":
        return 100
    if job.status == "pending":
        return 0
    if job.status == "parsing":
        return 3

    def frac(n: int) -> float:
        return min(n, job.total) / job.total if job.total else 0.0

    if job.kind == "students":
        # Hashing passwords is the slow part (0-90%); saving is the last 10%.
        if job.status == "hashing":
            return 5 + int(85 * frac(job.processed))
        if job.status == "saving":
            return 90 + int(10 * frac(job.created))
    else:
        if job.status == "saving":
            return 5 + int(95 * frac(job.created))
    return job.percent


class JobSubscription:
    """One open WebSocket's handle on a job: wait() returns when the job changed."""

    def __init__(self, tracker: "JobTracker", job_id: str):
        self._tracker = tracker
        self._job_id = job_id
        self._event = asyncio.Event()

    def notify(self):
        self._event.set()

    def clear(self):
        self._event.clear()

    async def wait(self):
        await self._event.wait()

    def close(self):
        self._tracker._unsubscribe(self._job_id, self)


class JobTracker:
    def __init__(self):
        self._jobs: Dict[str, UploadJob] = {}
        self._subs: Dict[str, Set[JobSubscription]] = {}

    def create(self, kind: str = "students", owner_id: Optional[str] = None) -> UploadJob:
        job = UploadJob(id=str(uuid4()), kind=kind, owner_id=owner_id)
        self._jobs[job.id] = job
        self._cleanup_old()
        return job

    def get(self, job_id: str) -> Optional[UploadJob]:
        return self._jobs.get(job_id)

    def update(self, job_id: str, **fields) -> Optional[UploadJob]:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        for key, value in fields.items():
            setattr(job, key, value)
        if job.status != "error":
            job.percent = 100 if job.status == "done" else max(job.percent, _compute_percent(job))
        for sub in list(self._subs.get(job_id, ())):
            sub.notify()
        return job

    def subscribe(self, job_id: str) -> JobSubscription:
        sub = JobSubscription(self, job_id)
        self._subs.setdefault(job_id, set()).add(sub)
        return sub

    def _unsubscribe(self, job_id: str, sub: JobSubscription):
        subs = self._subs.get(job_id)
        if subs:
            subs.discard(sub)
            if not subs:
                self._subs.pop(job_id, None)

    def _cleanup_old(self, max_age_seconds: int = 3600):
        now = time.time()
        stale = [jid for jid, job in self._jobs.items() if now - job.created_at > max_age_seconds]
        for jid in stale:
            self._jobs.pop(jid, None)
            self._subs.pop(jid, None)


upload_job_tracker = JobTracker()
