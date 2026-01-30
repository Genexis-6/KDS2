import { create } from "zustand";
import { SubjectModel } from "../../common/model/classModels/subject_model";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { useAuthTokenStore } from "./use_auth_token_store";
import { useStudentInfoStore } from "./use_student_info_store";
import { AllServerUrls } from "../http/all_server_url";

export interface AllSubjectInterface {
  className: string
  teacherName: string
  classId: string
  subjects: SubjectModel[],
}

type UseAllSubject = {
  subjects: AllSubjectInterface | null;
  getSubjects: () => Promise<void>;
  clearSub: () => void,
};

export const useAllSubjects = create<UseAllSubject>((set) => ({
  subjects: null,
  getSubjects: async () => {
    const { token } = useAuthTokenStore.getState();
    const { student } = useStudentInfoStore.getState();

    if (!student?.classId) {
      console.warn("No classId found — student info missing");
      return;
    }

    try {
      const subjects = await requestAllSubjects({
        classId: student.classId,
        token: token!,
      });
      set({ subjects });
    } catch (e) {
      console.error("Error getting subjects:", e);
    }
  },
  clearSub: () => {
    set({ subjects: null });
  }
}));

async function requestAllSubjects({
  classId,
  token,
}: {
  classId: string;
  token: string;
}) {
  const url = `${AllServerUrls.getAllSubjects}?classId=${classId}`;
  const res = await DefaultRequestSetUp.get<AllSubjectInterface>({
    url,
    token,
  });


  return res.data;
}
