import { create } from "zustand";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";
import { useAuthTokenStore } from "./use_auth_token_store";
import { useNotificationStore } from "./use_notification_store";
import type { TimerModel } from "../../common/model/classModels/timer_model";
import { useIsAuthenticatedStore } from "./use_is_authenticated_store";

// ---- Types ---- //
export interface StudentSubInfo {
  id?:string 
  studentName: string;
  identifier: number;
  score: number;
  total:number
}

export interface TimerInfo {
  duration: number;
  startTime: string;
  endTime: string;
}

export interface QuestionInfo {
  title: string;
  totalQuestions: number;
}

export interface SubjectFullInfo {
  timer: TimerModel | null;
  question: QuestionInfo | null;
  createdAt: string;
  students: StudentSubInfo[];
}

// ---- Zustand Store ---- //
type UseFullSubject = {
  subjectData?: SubjectFullInfo | null;
  isLoading: boolean;
  getSubjectFullInfo: (subjectId: string, subjectTitle: string) => Promise<void>;
  clearSubjectInfo: () => void;
};

export const useFullSubjectStore = create<UseFullSubject>((set) => ({
  subjectData: null,
  isLoading: false,

  getSubjectFullInfo: async (subjectId, subjectTitle) => {
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();
    const {isAuthenticated} = useIsAuthenticatedStore.getState()

    if(!isAuthenticated) return console.warn("user not authenticated")

    set({ isLoading: true });

    try {
      const res = await DefaultRequestSetUp.get<SubjectFullInfo>({
        url: `${AllServerUrls.subjects}/${subjectId}/${subjectTitle}`,
        token: token!,
      });
      if (res.statusCode === 200) {
        set({ subjectData: res.data });
      } else {
        showNotification(res.message || "Failed to load subject info", "error");
        set({ subjectData: null });
      }
    } catch (err) {
      console.error("Error fetching subject full info:", err);
      showNotification("Something went wrong while fetching data", "error");
    } finally {
      set({ isLoading: false });
    }
  },

  clearSubjectInfo: () => set({ subjectData: null }),
}));
