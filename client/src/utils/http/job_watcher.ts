import { AllServerUrls } from "./all_server_url"
import { AuthInterceptors } from "./auth_interceptors"
import { DefaultRequestSetUp } from "./default_request_set_up"
import { useAuthTokenStore } from "../hooks/use_auth_token_store"

export type JobPhase = "pending" | "parsing" | "hashing" | "saving" | "done" | "error"

export interface JobStatus {
    jobId: string
    kind?: "students" | "questions"
    status: JobPhase
    total: number
    processed: number   // rows finished in the current phase
    created: number     // rows actually saved to the database
    skipped: number
    percent?: number    // 0-100, computed by the server
    message: string
    error: string | null
}

const POLL_INTERVAL_MS = 1000
const MAX_POLL_FAILURES = 5
// Close codes sent by the server (routes/jobs/job_progress.py)
const WS_UNAUTHORIZED = 4401

function isFinished(status: JobPhase) {
    return status === "done" || status === "error"
}

function lostTrackOf(jobId: string, message: string): JobStatus {
    return { jobId, status: "error", total: 0, processed: 0, created: 0, skipped: 0, message, error: message }
}

/**
 * Follows a background upload job and calls `onUpdate` with every new state
 * until it is done or failed. Returns a function that stops watching.
 *
 *  1. Opens a WebSocket and authenticates with the access token as the first
 *     message (so the token is never in the URL).
 *  2. If the token was expired (close code 4401) it is refreshed through the
 *     same interceptor the HTTP requests use, then the socket is reopened once.
 *  3. If the socket can't be used at all (proxy blocks it, server restarted...)
 *     it falls back to polling GET /jobs/{id} so the bar still moves.
 */
export function watchJob(jobId: string, onUpdate: (status: JobStatus) => void): () => void {
    let stopped = false
    let socket: WebSocket | null = null
    let pollTimer: ReturnType<typeof setTimeout> | null = null
    let polling = false
    let authRetried = false
    let pollFailures = 0

    const stop = () => {
        stopped = true
        if (pollTimer) clearTimeout(pollTimer)
        try { socket?.close() } catch { /* already closed */ }
    }

    const deliver = (status: JobStatus) => {
        if (stopped) return
        onUpdate(status)
        if (isFinished(status.status)) stop()
    }

    const startPolling = () => {
        if (stopped || polling) return
        polling = true

        const tick = async () => {
            if (stopped) return
            try {
                const res = await DefaultRequestSetUp.get<JobStatus>({ url: `${AllServerUrls.jobStatus}/${jobId}` })
                if (res.statusCode === 200 && res.data) {
                    pollFailures = 0
                    deliver(res.data)
                } else if (res.statusCode === 404) {
                    deliver(lostTrackOf(jobId, "This upload can no longer be tracked. Check the list to see whether it finished."))
                    return
                } else {
                    pollFailures++
                }
            } catch {
                pollFailures++
            }
            if (stopped) return
            if (pollFailures >= MAX_POLL_FAILURES) {
                deliver(lostTrackOf(jobId, "Lost connection to the server while tracking this upload. It may still be running -- check the list."))
                return
            }
            pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
        }
        tick()
    }

    const connect = () => {
        let ws: WebSocket
        try {
            ws = new WebSocket(AllServerUrls.jobSocket(jobId))
        } catch {
            startPolling()
            return
        }
        socket = ws

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "auth", token: useAuthTokenStore.getState().token }))
        }

        ws.onmessage = (event: MessageEvent) => {
            try {
                deliver(JSON.parse(event.data as string) as JobStatus)
            } catch {
                /* ignore a malformed frame */
            }
        }

        ws.onclose = async (event: CloseEvent) => {
            if (stopped) return // we closed it ourselves (job finished / caller left)

            if (event.code === WS_UNAUTHORIZED && !authRetried) {
                authRetried = true
                const refreshed = await AuthInterceptors.refreshAccessToken(useAuthTokenStore.getState().token)
                if (stopped) return
                if (refreshed.ok) {
                    useAuthTokenStore.getState().setToken(refreshed.accessToken)
                    connect()
                    return
                }
                if (refreshed.sessionEnded) {
                    stop() // the refresh interceptor is already sending the user to login
                    return
                }
            }
            startPolling()
        }
    }

    connect()
    return stop
}
