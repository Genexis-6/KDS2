import { create } from "zustand";
import { useCurrentUserStore } from "./use_current_user";
import { useAuthTokenStore } from "./use_auth_token_store";
import { useStudentInfoStore } from "./use_student_info_store";
import { useAllSubjects } from "./use_all_subjects";




const KEY = "isAuthenticated";

type UseIsAuthenticatedParams = {
  isAuthenticated: boolean;
  isChecking: boolean;
  checkIsAuthenticated: () => Promise<void>;
  setIsAuthenticatedStatus: (val: boolean) => void;
  logout: () => Promise<void>;
};

export const useIsAuthenticatedStore = create<UseIsAuthenticatedParams>((set, get) => ({
  isAuthenticated: sessionStorage.getItem(KEY) === "true",
  isChecking: false,


  checkIsAuthenticated: async () => {
    set({ isChecking: true });

    if (!get().isAuthenticated) {
      set({ isChecking: false });
      return;
    }

    try {
      const { getAcessToken, token } = useAuthTokenStore.getState();
      const { getUser, user } = useCurrentUserStore.getState();
      // const { getSubjects } = useAllSubjects.getState()
      const { getStudentInfo } = useStudentInfoStore.getState();



      let accessToken = token;
      if (!accessToken) {
        await getAcessToken();
        accessToken = useAuthTokenStore.getState().token;
      }

      // Fetch or verify current user
      if (!user) {
        await getUser();
      }


      const validUser = useCurrentUserStore.getState().user;



      // Both token and user are valid
      if (accessToken && validUser) {
        set({ isAuthenticated: true });
        if (validUser.role === "student") {
          await getStudentInfo()
          await useAllSubjects.getState().getSubjects()
   
        }
        sessionStorage.setItem(KEY, "true");
      } else {
        //  Missing either token or user
        await get().logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await get().logout();
    } finally {
      set({ isChecking: false });
    }
  },

  // 🔹 Manual set (e.g., after login success)
  setIsAuthenticatedStatus: (val: boolean) => {
    set({ isAuthenticated: val });
    sessionStorage.setItem(KEY, String(val));
  },

  // 🔹 Clear everything
  logout: async () => {
    set({ isAuthenticated: false });
    sessionStorage.removeItem(KEY);

    // Reset other stores
    const { setToken, clearToken } = useAuthTokenStore.getState();
    const { setUser } = useCurrentUserStore.getState();
    setToken(null as any);
    setUser(null as any);
    clearToken()


  },
}));
