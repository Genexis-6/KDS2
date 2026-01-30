import { create } from "zustand";
import { useStudentAnswers } from "./use_student_answers";
import { useIsAuthenticatedStore } from "./use_is_authenticated_store";
import { useAuthTokenStore } from "./use_auth_token_store";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";
import { QuestionSubmittionModel } from "../../common/model/classModels/question_submittion_model";
import { useStudentInfoStore } from "./use_student_info_store";
import { useSelectedExam } from "./use_selected_exam";





type useExamSubmittion = {
    isSubmitting: boolean
    submitted: boolean
    submitExam: () => Promise<void>
}




export const useExamSubmittionStore = create<useExamSubmittion>((set) => (
    {
        allAnswers: (() => {
            const { allUserAnswers } = useStudentAnswers.getState()
            return allUserAnswers;
        })(),
        submitted: false,
        isSubmitting: false,
        submitExam: async () => {
            const { isAuthenticated } = useIsAuthenticatedStore.getState()
            const { token } = useAuthTokenStore.getState()
            const { student } = useStudentInfoStore.getState()
            const { selectedExam } = useSelectedExam.getState()
            const { allUserAnswers } = useStudentAnswers.getState()

            if (!isAuthenticated) return console.warn("user not authenticated")

            try {
                set({ isSubmitting: false })
                const dt = new QuestionSubmittionModel({ subjectId: selectedExam?.id!, studentId: student?.id!, answers: allUserAnswers })
                const submittionStatsu = await requestSubmitExam({ token: token!, answers: dt })
                set({ submitted: submittionStatsu })

            } catch (e) {

            } finally {
                set({ isSubmitting: false })
            }
        }
    }
))




async function requestSubmitExam({ token, answers }: { token: string, answers: QuestionSubmittionModel }) {
    var res = await DefaultRequestSetUp.post<QuestionSubmittionModel, boolean>({ url: AllServerUrls.submitExam, data: answers, token: token })
    if (res.statusCode === 400) {
        return false
    }
    return true
}