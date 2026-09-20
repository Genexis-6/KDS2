"""
WebSocket progress feed for background upload jobs (bulk students, questions...).

    ws(s)://<api>/ws/jobs/{job_id}

Protocol
  1. Client connects, then within AUTH_TIMEOUT_S sends:  {"type": "auth", "token": "<access token>"}
     (The token goes in the first message, not the URL, so it never lands in access logs.)
  2. Server pushes:  {"type": "progress", "job": <job_snapshot>}   whenever something changes
  3. Server closes with code 1000 once the job has finished.

Close codes: 4401 not authenticated / token expired, 4403 not an admin, 4404 job not found.

It is generic: any job created with `upload_job_tracker.create()` can be watched,
so students and questions share this one endpoint.
"""
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.exceptions import HTTPException

from app.security.token_generator import _validate_token, ACCESS_TOKEN_TYPE
from app.utils.job_tracker import upload_job_tracker
from app.utils.job_snapshot import job_snapshot

job_ws = APIRouter(tags=["jobs"])

AUTH_TIMEOUT_S = 10
POLL_INTERVAL_S = 0.4      # how often the server checks the tracker (not the network)
MAX_WATCH_S = 60 * 30      # never hold a socket open forever

WS_UNAUTHORIZED = 4401
WS_FORBIDDEN = 4403
WS_NOT_FOUND = 4404


async def _authenticate(websocket: WebSocket):
    """Returns the token payload, or None after closing the socket."""
    try:
        first = await asyncio.wait_for(websocket.receive_json(), timeout=AUTH_TIMEOUT_S)
    except asyncio.TimeoutError:
        await websocket.close(code=WS_UNAUTHORIZED, reason="auth timeout")
        return None
    except ValueError:  # not valid JSON
        await websocket.close(code=WS_UNAUTHORIZED, reason="expected an auth message")
        return None

    token = first.get("token") if isinstance(first, dict) and first.get("type") == "auth" else None
    if not token:
        await websocket.close(code=WS_UNAUTHORIZED, reason="expected an auth message")
        return None

    try:
        # db=None on purpose: this feed is admin-only and admins have no session
        # row. A student's token fails here with "session required" -> 401.
        user = await _validate_token(token, None, ACCESS_TOKEN_TYPE)
    except HTTPException as e:
        await websocket.close(code=WS_UNAUTHORIZED, reason=str(e.detail)[:120])
        return None

    if user.get("role") != "admin":
        await websocket.close(code=WS_FORBIDDEN, reason="admins only")
        return None
    return user


@job_ws.websocket("/ws/jobs/{job_id}")
async def watch_job(websocket: WebSocket, job_id: str):
    await websocket.accept()
    try:
        if await _authenticate(websocket) is None:
            return

        loop = asyncio.get_running_loop()
        deadline = loop.time() + MAX_WATCH_S
        last = None

        while True:
            job = upload_job_tracker.get(job_id)
            if job is None:
                await websocket.send_json({"type": "error", "message": "job not found or has expired"})
                await websocket.close(code=WS_NOT_FOUND, reason="job not found")
                return

            snap = job_snapshot(job)
            if snap != last:
                await websocket.send_json({"type": "progress", "job": snap})
                last = snap

            if snap["live"]["finished"]:
                await websocket.close(code=1000)
                return

            if loop.time() > deadline:
                await websocket.close(code=1001, reason="watch timed out")
                return

            await asyncio.sleep(POLL_INTERVAL_S)

    except WebSocketDisconnect:
        return
