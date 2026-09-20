import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from app.repo.schemas.default_server_res import DefaultServerApiRes
from app.security.token_generator import verify_token
from app.utils.job_stream import stream_job
from app.utils.job_tracker import upload_job_tracker

jobs = APIRouter(tags=["jobs"])

# Custom WebSocket close codes (4000-4999 is the range reserved for apps).
# The browser sees these in `event.code`.
WS_BAD_REQUEST = 4400
WS_UNAUTHORIZED = 4401   # missing / expired / invalid access token -> client refreshes and retries
WS_FORBIDDEN = 4403
WS_NOT_FOUND = 4404

AUTH_TIMEOUT_SECONDS = 10


async def _close(websocket: WebSocket, code: int):
    try:
        await websocket.close(code=code)
    except Exception:
        pass  # already closed by the client


@jobs.websocket("/ws/jobs/{job_id}")
async def job_progress_ws(websocket: WebSocket, job_id: str):
    """
    Live progress for a bulk-upload job (students or questions).

    Protocol:
      1. client connects and sends   {"type": "auth", "token": "<access token>"}
      2. server streams              {"jobId", "kind", "status", "total", "processed",
                                      "created", "skipped", "percent", "message", "error"}
         the moment the job changes, and closes normally once status is done/error.

    The token goes in the first message rather than the URL so it never ends up
    in server logs or browser history. We accept() first so the custom 44xx close
    codes actually reach the browser (closing before accept becomes a bare 403).
    """
    await websocket.accept()

    try:
        first = await asyncio.wait_for(websocket.receive_json(), timeout=AUTH_TIMEOUT_SECONDS)
    except Exception:  # timeout, disconnect, or not valid JSON
        await _close(websocket, WS_BAD_REQUEST)
        return

    token = first.get("token") if isinstance(first, dict) and first.get("type") == "auth" else None
    if not token:
        await _close(websocket, WS_UNAUTHORIZED)
        return

    try:
        user = await verify_token(token, None)
    except HTTPException as e:
        await _close(websocket, WS_UNAUTHORIZED if e.status_code == 401 else WS_FORBIDDEN)
        return

    if user.get("role") != "admin":
        await _close(websocket, WS_FORBIDDEN)
        return

    job = upload_job_tracker.get(job_id)
    # Same close code for "no such job" and "someone else's job": don't reveal which.
    if job is None or job.owner_id != str(user.get("id")):
        await _close(websocket, WS_NOT_FOUND)
        return

    async def wait_disconnect():
        try:
            while True:
                await websocket.receive_text()
        except (WebSocketDisconnect, RuntimeError):
            return

    try:
        await stream_job(job, upload_job_tracker, websocket.send_json, wait_disconnect)
    except (WebSocketDisconnect, RuntimeError):
        return  # client went away mid-send

    await _close(websocket, 1000)


@jobs.get("/jobs/{job_id}", response_model=DefaultServerApiRes[dict])
async def get_job_status(job_id: str, current_user: Annotated[dict, Depends(verify_token)]):
    """Plain-HTTP fallback for the WebSocket (e.g. a proxy that blocks it)."""
    if current_user.get("role") != "admin":
        return JSONResponse(content={"message": "only an admin can view upload progress"}, status_code=403)

    job = upload_job_tracker.get(job_id)
    if job is None or job.owner_id != str(current_user.get("id")):
        return JSONResponse(content={"message": "job not found or has expired"}, status_code=404)

    return DefaultServerApiRes(statusCode=200, message="job status", data=job.as_dict())
