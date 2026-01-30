import { create } from "zustand";
import type { StudentModels } from "../../common/model/studentModels/student_model";
import { useIsAuthenticatedStore } from "./use_is_authenticated_store";
import { useAuthTokenStore } from "./use_auth_token_store";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";


type UseStudentInfo = {
  student: StudentModels | null;
  setStudentInfo: (student: StudentModels) => void;
  getStudentInfo: () => Promise<void>;
  clearStudentInfo: () => void
};

export const useStudentInfoStore = create<UseStudentInfo>((set, get) => ({
  student: null,

  setStudentInfo: (student) => {
    set({ student });
  },

  getStudentInfo: async () => {
    const { isAuthenticated } = useIsAuthenticatedStore.getState();
    const { token } = useAuthTokenStore.getState();



    if (!isAuthenticated || !token) return;


    if (get().student !== null) return;

    try {
      const newStudent = await requestStudentInfo({ token });
      set({ student: newStudent });

    } catch (err) {
      console.error("Failed to fetch student info:", err);
    }
  },
  clearStudentInfo: () => {
    set({ student: null })
  }
}));

async function requestStudentInfo({ token }: { token: string }) {

  const res = await DefaultRequestSetUp.get<StudentModels>({
    url: AllServerUrls.getStudentInfoUrl,
    token,
  });


  return res.data;
}
