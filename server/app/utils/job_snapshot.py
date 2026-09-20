"""
One place that turns an `upload_job_tracker` job into the progress payload the
UI shows -- shared by the WebSocket route and the polling status endpoint, so
both always agree.

The raw `job.as_dict()` is passed through untouched (existing clients keep
working). A normalised, predictable block is added under the extra key "live":

    live = {
        "state":     "running" | "completed" | "failed",
        "finished":  bool,
        "total":     int,   # rows in the upload (0 until known)
        "processed": int,   # rows handled so far (succeeded + failed)
        "succeeded": int,
        "failed":    int,
        "percent":   int,   # 0-100
        "message":   str | None,
        "errors":    list[str],   # first few row errors
    }

The tracker's field names were not visible when this was written, so
`_pick_int` / `_pick_str` accept the usual spellings. If your tracker uses
different names, add them to the tuples below -- nothing else needs to change.
"""
from typing import Any, Optional

_TOTAL_KEYS = ("total", "total_count", "total_rows", "total_items", "count")
_PROCESSED_KEYS = ("processed", "processed_count", "current", "done_count", "completed_count")
_SUCCESS_KEYS = ("succeeded", "success", "success_count", "successful", "created", "inserted", "uploaded", "added")
_FAILED_KEYS = ("failed", "failed_count", "error_count", "errors_count", "skipped")
_STATUS_KEYS = ("status", "state")
_MESSAGE_KEYS = ("message", "detail")
_ERROR_LIST_KEYS = ("errors", "failures", "failed_rows")
_FINISHED_FLAGS = ("finished", "is_done", "is_finished", "done", "completed")

_OK_STATES = {"completed", "complete", "done", "finished", "success", "succeeded"}
_FAIL_STATES = {"failed", "error", "errored", "cancelled", "canceled"}

MAX_ERRORS_SENT = 50


def _pick_int(raw: dict, keys) -> Optional[int]:
    for k in keys:
        v = raw.get(k)
        if isinstance(v, int) and not isinstance(v, bool):
            return v
        if isinstance(v, (list, tuple, set)):  # e.g. "errors": [...] -> count
            return len(v)
    return None


def _pick_str(raw: dict, keys) -> Optional[str]:
    for k in keys:
        v = raw.get(k)
        if isinstance(v, str) and v:
            return v
    return None


def _pick_errors(raw: dict) -> list:
    for k in _ERROR_LIST_KEYS:
        v = raw.get(k)
        if isinstance(v, (list, tuple)):
            return [str(e) for e in v[:MAX_ERRORS_SENT]]
    return []


def job_snapshot(job: Any) -> dict:
    raw = job.as_dict() if hasattr(job, "as_dict") else dict(job)

    total = _pick_int(raw, _TOTAL_KEYS) or 0
    succeeded = _pick_int(raw, _SUCCESS_KEYS) or 0
    failed = _pick_int(raw, _FAILED_KEYS) or 0
    processed = _pick_int(raw, _PROCESSED_KEYS)
    if processed is None:
        processed = succeeded + failed

    status = (_pick_str(raw, _STATUS_KEYS) or "").lower()
    has_status = bool(status)

    if status in _OK_STATES:
        state = "completed"
    elif status in _FAIL_STATES:
        state = "failed"
    else:
        state = "running"

    finished = state != "running"
    if not has_status:
        # No status field at all: fall back to boolean flags, then to the counts.
        if any(raw.get(f) is True for f in _FINISHED_FLAGS):
            finished, state = True, "completed"
        elif total > 0 and processed >= total:
            finished, state = True, "completed"

    percent = 100 if (finished and state == "completed") else (
        min(100, int(processed * 100 / total)) if total else 0
    )

    return {
        **raw,
        "live": {
            "state": state,
            "finished": finished,
            "total": total,
            "processed": processed,
            "succeeded": succeeded,
            "failed": failed,
            "percent": percent,
            "message": _pick_str(raw, _MESSAGE_KEYS),
            "errors": _pick_errors(raw),
        },
    }
