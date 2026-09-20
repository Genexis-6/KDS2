import { AllServerUrls } from "./all_server_url"

/**
 * The two 401 interceptors.
 *
 *  1. ACCESS-TOKEN interceptor  -> `refreshAccessToken()`
 *     Runs when a request comes back 401 (access token expired). Asks the
 *     server for a new access token using the refresh-token cookie, so the
 *     failed request can be replayed.
 *
 *  2. REFRESH-TOKEN interceptor -> `onRefreshTokenRejected()` (private)
 *     Runs when that refresh call ALSO comes back 401 (refresh token expired,
 *     missing, or the session was ended). The login is over: the server has
 *     already deleted the student's session while answering the refresh call,
 *     so here the client wipes its own state and sends the user to login.
 *
 * This file deliberately has no store imports, so nothing can import-cycle
 * with it. The "what to do when the session is over" part is plugged in with
 * `setSessionEndedHandler` (see common/viewModel/session_expiry.ts).
 */

export type RefreshResult =
    | { ok: true; accessToken: string }
    // sessionEnded: true  -> refresh token was rejected (401), the session is over
    // sessionEnded: false -> transient failure (network / 5xx); the session may still be fine
    | { ok: false; sessionEnded: boolean }

type SessionEndedHandler = (message: string) => void

const DEFAULT_SESSION_ENDED_MESSAGE = "Your session has ended, please log in again."

export class AuthInterceptors {
    // Every request that 401s at the same moment shares ONE refresh call.
    private static inFlight: Promise<RefreshResult> | null = null
    private static sessionEnded = false
    private static sessionEndedHandler: SessionEndedHandler | null = null

    static setSessionEndedHandler(handler: SessionEndedHandler) {
        AuthInterceptors.sessionEndedHandler = handler
    }

    /** 401s from login / refresh themselves mean something else and must never trigger a refresh (it would loop). */
    static shouldIntercept(url: string): boolean {
        return !url.startsWith(AllServerUrls.login) && !url.startsWith(AllServerUrls.getRefreshToken)
    }

    // ── Interceptor 1: access token rejected ───────────────────────────────
    /**
     * @param staleToken the access token that just failed (if any). It is sent
     * along so the server can still identify and end the session even if the
     * refresh cookie is gone.
     */
    static refreshAccessToken(staleToken?: string | null): Promise<RefreshResult> {
        if (AuthInterceptors.sessionEnded) {
            return Promise.resolve({ ok: false, sessionEnded: true })
        }
        if (!AuthInterceptors.inFlight) {
            AuthInterceptors.inFlight = AuthInterceptors.callRefreshEndpoint(staleToken)
                .finally(() => { AuthInterceptors.inFlight = null })
        }
        return AuthInterceptors.inFlight
    }

    private static async callRefreshEndpoint(staleToken?: string | null): Promise<RefreshResult> {
        try {
            const res = await fetch(AllServerUrls.getRefreshToken, {
                method: "GET",
                credentials: "include", // sends the httpOnly refresh_token cookie
                headers: staleToken ? { Authorization: `Bearer ${staleToken}` } : {},
            })

            if (res.status === 401) {
                const body = await res.json().catch(() => ({}))
                AuthInterceptors.onRefreshTokenRejected(body?.message ?? body?.detail)
                return { ok: false, sessionEnded: true }
            }

            if (!res.ok) return { ok: false, sessionEnded: false }

            const body = await res.json()
            const accessToken: string | undefined = body?.data?.accessToken
            return accessToken ? { ok: true, accessToken } : { ok: false, sessionEnded: false }
        } catch {
            // Server unreachable etc. Not proof the session is dead, so don't end it.
            return { ok: false, sessionEnded: false }
        }
    }

    // ── Interceptor 2: refresh token rejected ──────────────────────────────
    private static onRefreshTokenRejected(serverMessage?: string) {
        if (AuthInterceptors.sessionEnded) return // only once, however many requests were waiting
        AuthInterceptors.sessionEnded = true
        AuthInterceptors.sessionEndedHandler?.(serverMessage || DEFAULT_SESSION_ENDED_MESSAGE)
    }
}
