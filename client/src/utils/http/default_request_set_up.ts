import { useNotificationStore } from "../hooks/use_notification_store"
import type { DefaultServerRes } from "./default_server_res"

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

  // 🔹 POST
  static async post<TModel, TRes>({
    url,
    contentType = "application/json",
    data,
    token,
  }: postParams<TModel>): Promise<DefaultServerRes<TRes>> {
    const { showNotification } = useNotificationStore.getState()
    try {
      const isFormData = data instanceof FormData
      const headers = DefaultRequestSetUp.headerType({
        contentType,
        token,
        skipContentType: isFormData,
      })

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: isFormData ? (data as any) : JSON.stringify(data),
      })

      const resData = await res.json()

      if (!res.ok)
        showNotification(resData.detail || "Error making this request", "error")

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

  // 🔹 GET
  static async get<TRes>({
    url,
    contentType = "application/json",
    token,
  }: getParams): Promise<DefaultServerRes<TRes>> {
    const { showNotification } = useNotificationStore.getState()
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: DefaultRequestSetUp.headerType({ contentType, token }),
      })

      const resData = await res.json()

      if (!res.ok)
        showNotification(resData.detail || "Error making this request", "error")

      return {
        ...(resData as object),
        statusCode: resData.status_code ?? res.status,
      } as DefaultServerRes<TRes>
    } catch (e) {
      showNotification(
        "Error communicating with server... call technical team",
        "error"
      )
      throw e
    }
  }

 
  static async put<TModel, TRes>({
    url,
    contentType = "application/json",
    data,
    token,
  }: putParams<TModel>): Promise<DefaultServerRes<TRes>> {
    const { showNotification } = useNotificationStore.getState()
    try {
      const isFormData = data instanceof FormData
      const headers = DefaultRequestSetUp.headerType({
        contentType,
        token,
        skipContentType: isFormData,
      })

      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers,
        body: isFormData ? (data as any) : JSON.stringify(data),
      })

      const resData = await res.json()

      if (!res.ok)
        showNotification(resData.detail || "Error making this request", "error")

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

  // 🔹 DELETE
  static async delete<TModel, TRes>({
    url,
    data,
    contentType = "application/json",
    token,
  }: deleteParams<TModel>): Promise<DefaultServerRes<TRes>> {
    const { showNotification } = useNotificationStore.getState()
    try {
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: DefaultRequestSetUp.headerType({ contentType, token }),
        body: data ? JSON.stringify(data) : undefined,
      })

      const resData = await res.json()

      if (!res.ok)
        showNotification(resData.detail || "Error performing delete", "error")

      return {
        ...(resData as object),
        statusCode: resData.status_code ?? res.status,
      } as DefaultServerRes<TRes>
    } catch (e) {
      showNotification(
        "Error communicating with server... call technical team",
        "error"
      )
      throw e
    }
  }
}
