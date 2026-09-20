import { create } from "zustand";
import { AuthInterceptors } from "../http/auth_interceptors";



type useAuthTokenParam = {
    token?: string | null,
    setToken: (newToken: string) => void,
    getAcessToken: () => Promise<void>
    clearToken: () => void
}


export const useAuthTokenStore = create<useAuthTokenParam>(
    (set, get) => ({
        token: null,
        setToken: (newToken) => {
            set({ token: newToken })
        },
        // Asks the server for a fresh access token using the refresh cookie.
        // Uses the same single-flight refresh as the 401 interceptor, and if the
        // refresh token is rejected it triggers the same "session ended" handling.
        // Never throws: on failure the token is simply left unchanged.
        getAcessToken: async () => {
            const result = await AuthInterceptors.refreshAccessToken(get().token)
            if (result.ok) set({ token: result.accessToken })
        },
        clearToken: () => {
            set({ token: null })
        }
    })
)
