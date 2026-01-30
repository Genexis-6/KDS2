import { create } from "zustand";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";
import { useAuthTokenStore } from "./use_auth_token_store";
import type { userRole } from "../../features/auth/view/pages/Login";

export interface currentUser {
  id: string;
  identifier: string;
  fullName: string;
  role: userRole;
}

type useCurrentUserParam = {
  userType: userRole | null;
  user?: currentUser | null;
  setUser: (newUser: currentUser | null) => void;
  getUser: () => Promise<void>;
};

export const useCurrentUserStore = create<useCurrentUserParam>((set) => ({
  userType: null, 
  user: null,

  setUser: (newUser) => {
    set({
      user: newUser,
      userType: newUser ? newUser.role : null, 
    });
  },

  getUser: async () => {
    const { token, getAcessToken } = useAuthTokenStore.getState();

    let accessToken = token;
    if (!accessToken) {
      await getAcessToken(); // wait for refresh
      accessToken = useAuthTokenStore.getState().token;
    }

    if (!accessToken) {
      console.warn("No access token available — user not authenticated");
      set({ user: null, userType: null });
      return;
    }

    const newUser = await getCurrentUser(accessToken);
    set({
      user: newUser,
      userType: newUser ? newUser.role : null,
    });
  },
}));

async function getCurrentUser(token?: string) {
  const res = await DefaultRequestSetUp.get<currentUser>({
    url: AllServerUrls.currentUser,
    token: token,
  });
  if (res.statusCode === 401) {
    return null;
  } else {
    return res.data;
  }
}
