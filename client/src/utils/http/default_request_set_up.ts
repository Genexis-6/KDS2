import { useNotificationStore } from "../hooks/use_notification_store"
import { useAuthTokenStore } from "../hooks/use_auth_token_store"
import { AuthInterceptors } from "./auth_interceptors"
import type { DefaultServerRes } from "./default_server_res"

// `token` is still accepted so existing call sites keep compiling, but it is
// only a fallback now: the request always sends the LATEST token from the
// auth store, so a token that was refreshed a moment ago is never overridden
// by a stale one captured earlier in the caller.
type postParams<T> = {
  url: string
  contentType?: string
  data: T
  token?: string
}

type putParams<T> = {
  url: string
  contentType?: string
  data: T
  token?: string
}

type getParams = {
  url: string
  contentType?: string
  token?: string
}

type deleteParams<T> = {
  url: string
  data?: T
  contentType?: string
  token?: string
}

type RequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  url: string
  contentType: string
  data?: unknown
  token?: string
  fallbackError: string
}

type RecoveryOutcome =
  | { kind: "retried"; response: Response }
  | { kind: "session-ended" }
  | { kind: "failed" }

export class DefaultRequestSetUp {
  static headerType({
    contentType,
    token,
    skipContentType = false,
  }: { contentType: string; token?: string; skipContentType?: boolean }) {
    const headers: Record<string, string> = {}
    if (!skipContentType) headers["Content-Type"] = contentType
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
  }

  private static send(config: RequestConfig, token?: string | null): Promise<Response> {
    const isFormData = config.data instanceof FormData
    const hasBody = config.data !== undefined && config.data !== null
    return fetch(config.url, {
      method: config.method,
      credentials: "include",
      headers: DefaultRequestSetUp.headerType({
        contentType: config.contentType,
        token: token ?? undefined,
        skipContentType: isFormData,
      }),
      body: hasBody ? (isFormData ? (config.data as FormData) : JSON.stringify(config.data)) : undefined,
    })
  }

  /**
   * ACCESS-TOKEN interceptor: the request came back 401, so try to get a new
   * access token and replay the request once.
   *  - retried       -> use the replayed response
   *  - session-ended -> the refresh token was rejected too; the refresh
   *                     interceptor is already logging the user out
   *  - failed        -> refresh had a transient problem; keep the original 401
   */
  private static async recoverFrom401(config: RequestConfig, sentToken?: string | null): Promise<RecoveryOutcome> {
    // Another request may have refreshed while this one was in flight.
    const latest = useAuthTokenStore.getState().token
    if (latest && latest !== sentToken) {
      return { kind: "retried", response: await DefaultRequestSetUp.send(config, latest) }
    }

    const refreshed = await AuthInterceptors.refreshAccessToken(sentToken)
    if (refreshed.ok) {
      useAuthTokenStore.getState().setToken(refreshed.accessToken)
      return { kind: "retried", response: await DefaultRequestSetUp.send(config, refreshed.accessToken) }
    }
    return refreshed.sessionEnded ? { kind: "session-ended" } : { kind: "failed" }
  }

  private static async request<TRes>(config: RequestConfig): Promise<DefaultServerRes<TRes>> {
    const { showNotification } = useNotificationStore.getState()
    try {
      const sentToken = useAuthTokenStore.getState().token ?? config.token
      let res = await DefaultRequestSetUp.send(config, sentToken)

      if (res.status === 401 && AuthInterceptors.shouldIntercept(config.url)) {
        const outcome = await DefaultRequestSetUp.recoverFrom401(config, sentToken)
        if (outcome.kind === "session-ended") {
          // Already being handled (state wiped + redirect to login with a
          // notice), so no extra error toast for this request.
          return {
            statusCode: 401,
            message: "Your session has ended, please log in again.",
            data: undefined as unknown as TRes,
          }
        }
        if (outcome.kind === "retried") res = outcome.response
      }

      const resData = await res.json()

      if (!res.ok)
        showNotification(resData.detail || resData.message || config.fallbackError, "error")

      return {
        ...(resData as object),
        statusCode: resData.status_code ?? res.status,
        message: resData.message ?? resData.detail ?? "",
      } as DefaultServerRes<TRes>
    } catch (e) {
      showNotification(
        "Error communicating with server... call technical team",
        "error"
      )
      throw e
    }
  }

  // 🔹 POST
  static async post<TModel, TRes>({
    url,
    contentType = "application/json",
    data,
    token,
  }: postParams<TModel>): Promise<DefaultServerRes<TRes>> {
    return DefaultRequestSetUp.request<TRes>({
      method: "POST", url, contentType, data, token, fallbackError: "Error making this request",
    })
  }

  // 🔹 GET
  static async get<TRes>({
    url,
    contentType = "application/json",
    token,
  }: getParams): Promise<DefaultServerRes<TRes>> {
    return DefaultRequestSetUp.request<TRes>({
      method: "GET", url, contentType, token, fallbackError: "Error making this request",
    })
  }

  // 🔹 PUT
  static async put<TModel, TRes>({
    url,
    contentType = "application/json",
    data,
    token,
  }: putParams<TModel>): Promise<DefaultServerRes<TRes>> {
    return DefaultRequestSetUp.request<TRes>({
      method: "PUT", url, contentType, data, token, fallbackError: "Error making this request",
    })
  }

  // 🔹 DELETE
  static async delete<TModel, TRes>({
    url,
    data,
    contentType = "application/json",
    token,
  }: deleteParams<TModel>): Promise<DefaultServerRes<TRes>> {
    return DefaultRequestSetUp.request<TRes>({
      method: "DELETE", url, contentType, data, token, fallbackError: "Error performing delete",
    })
  }
}
