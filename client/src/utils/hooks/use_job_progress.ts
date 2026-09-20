import { useEffect, useRef, useState } from "react"
import { useAuthTokenStore } from "./use_auth_token_store"
import { AuthInterceptors } from "../http/auth_interceptors"
import { AllServerUrls } from "../http/all_server_url"
import { DefaultRequestSetUp } from "../http/default_request_set_up"

/**
 * Live progress of a background upload job (bulk students, questions, ...).
 *
 *  1. Opens  ws(s)://<api>/ws/jobs/{jobId}  and authenticates with the access
 *     token in the first message (see server routes/auth/job_progress.py).
 *  2. If the token was expired (close code 4401) it refreshes once and reconnects.
 *  3. If the socket can't be used or drops mid-job, it silently falls back to
 *     polling the status endpoint, so the bar keeps moving either way.
 */

export type JobState = "connecting" | "running" | "completed" | "failed"

export type JobProgress = {
    state: JobState
    total: number
    processed: number
    succeeded: number
    failed: number
    percent: number
    message?: string | null
    errors: string[]
}

const INITIAL: JobProgress = {
    state: "connecting", total: 0, processed: 0, succeeded: 0, failed: 0, percent: 0, errors: [],
}

const WS_UNAUTHORIZED = 4401
const WS_NOT_FOUND = 4404
const POLL_MS = 1000
const MAX_POLL_ERRORS = 5

/** API root, derived from a URL we already know (…/auth/refresh_token) so no new config is needed. */
function apiBase(): string {
    const u = new URL(AllServerUrls.getRefreshToken, window.location.href)
    return (u.origin + u.pathname.replace(/\/auth\/refresh_token\/?$/, "")).replace(/\/$/, "")
}

const wsUrl = (jobId: string) => `${apiBase().replace(/^http/, "ws")}/ws/jobs/${encodeURIComponent(jobId)}`
const defaultPollUrl = (jobId: string) => `${apiBase()}/auth/register/bulk/status/${encodeURIComponent(jobId)}`

type Options = {
    /** Status endpoint used for the polling fallback. Defaults to the bulk-student one. */
    pollUrl?: string
    /** Called once when the job reaches completed / failed. */
    onFinished?: (progress: JobProgress) => void
}

export function useJobProgress(jobId: string | null | undefined, options: Options = {}): JobProgress {
    const [progress, setProgress] = useState<JobProgress>(INITIAL)
    const onFinishedRef = useRef(options.onFinished)
    onFinishedRef.current = options.onFinished
    const pollUrl = options.pollUrl

    useEffect(() => {
        setProgress(INITIAL)
        if (!jobId) return

        let cancelled = false
        let finished = false
        let refreshedOnce = false
        let ws: WebSocket | null = null
        let pollTimer: ReturnType<typeof setTimeout> | null = null

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apply = (job: any) => {
            const live = job?.live
            if (!live || cancelled) return
            const next: JobProgress = {
                state: live.state,
                total: live.total ?? 0,
                processed: live.processed ?? 0,
                succeeded: live.succeeded ?? 0,
                failed: live.failed ?? 0,
                percent: live.percent ?? 0,
                message: live.message,
                errors: live.errors ?? [],
            }
            setProgress(next)
            if (live.finished && !finished) {
                finished = true
                onFinishedRef.current?.(next)
            }
        }

        const failWith = (message: string) => {
            if (finished || cancelled) return
            finished = true
            setProgress(p => ({ ...p, state: "failed", message }))
        }

        // ── polling fallback ────────────────────────────────────────────
        let pollErrors = 0
        const poll = async () => {
            if (cancelled || finished) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res = await DefaultRequestSetUp.get<any>({ url: pollUrl ?? defaultPollUrl(jobId) })
                if (res.statusCode === 200 && res.data) { pollErrors = 0; apply(res.data) }
                else if (res.statusCode === 404) return failWith("This upload job was not found or has expired.")
                else if (res.statusCode === 401) return // session ended: the app is already redirecting to login
                else pollErrors++
            } catch {
                pollErrors++
            }
            if (pollErrors >= MAX_POLL_ERRORS) return failWith("Lost contact with the server.")
            if (!cancelled && !finished) pollTimer = setTimeout(poll, POLL_MS)
        }

        // ── websocket ───────────────────────────────────────────────────
        const connect = () => {
            const token = useAuthTokenStore.getState().token
            let socket: WebSocket
            try {
                socket = new WebSocket(wsUrl(jobId))
            } catch {
                poll()
                return
            }
            ws = socket

            socket.onopen = () => socket.send(JSON.stringify({ type: "auth", token }))

            socket.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data)
                    if (msg.type === "progress") apply(msg.job)
                } catch { /* ignore a malformed frame */ }
            }

            socket.onclose = async (ev) => {
                if (cancelled || finished) return

                if (ev.code === WS_UNAUTHORIZED && !refreshedOnce) {
                    refreshedOnce = true
                    const r = await AuthInterceptors.refreshAccessToken(token)
                    if (r.ok) {
                        useAuthTokenStore.getState().setToken(r.accessToken)
                        if (!cancelled) connect()
                        return
                    }
                    if (r.sessionEnded) return // the interceptor is already sending the user to login
                }
                if (ev.code === WS_NOT_FOUND) return failWith("This upload job was not found or has expired.")

                poll() // anything else: keep going over plain HTTP
            }
            // onerror is always followed by onclose, which handles the fallback.
        }

        connect()

        return () => {
            cancelled = true
            if (pollTimer) clearTimeout(pollTimer)
            if (ws) { ws.onclose = null; ws.close() }
        }
    }, [jobId, pollUrl])

    return progress
}
