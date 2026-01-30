import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SubjectModel } from "../../common/model/classModels/subject_model";
import type { StudentModels } from "../../common/model/studentModels/student_model";
import { useIsAuthenticatedStore } from "./use_is_authenticated_store";
import { useAuthTokenStore } from "./use_auth_token_store";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";
import { useNotificationStore } from "./use_notification_store";

export interface useViewClassInfoData {
  classId:string
  className: string;
  teacherName: string;
  subjects: SubjectModel[] | [];
  students: StudentModels[] | [];
}

type useViewClassInfo = {
  viewClassData?: useViewClassInfoData | null;
  getClassInfo: (className: string) => Promise<void>;
  setClassViewInfo: (dt: useViewClassInfoData) => void;
  clearCache: () => void;
};

export const useViewClassInfoStore = create<useViewClassInfo>()(
  persist(
    (set) => ({
      viewClassData: null,

      getClassInfo: async (className) => {
        const { isAuthenticated } = useIsAuthenticatedStore.getState();
        const { token } = useAuthTokenStore.getState();

        if (!token || !isAuthenticated) {
          console.warn("User not authenticated");
          return;
        }


        try {
          const dt = await requestClassViewInfoData({
            token: token,
            className: className,
          });
          if (dt) {
            set({ viewClassData: dt });
          }
        } catch (e) {
          console.warn("Error getting class info:", e);
        }
      },

      setClassViewInfo: (dt) => {
        set({ viewClassData: dt });
      },

      clearCache: () => {
        set({ viewClassData: null });
        sessionStorage.removeItem("view-class-info-storage");
      },
    }),
    {
      name: "view-class-info-storage", // 🔹 sessionStorage key
      partialize: (state) => ({ viewClassData: state.viewClassData }), // save only this field
    }
  )
);

// --------------------
// Helper API Function
// --------------------
async function requestClassViewInfoData({
  token,
  className,
}: {
  token: string;
  className: string;
}) {
  const res = await DefaultRequestSetUp.get<useViewClassInfoData>({
    url: `${AllServerUrls.getClassInfo}?className=${className}`,
    token: token,
  });

  useNotificationStore
    .getState()
    .showNotification(
      res.message,
      res.statusCode === 404 ? "error" : "info"
    );

  
  return res.data;
}
