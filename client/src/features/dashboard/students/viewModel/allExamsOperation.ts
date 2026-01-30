import { AppUrl } from "../../../../common/routes/app_urls";
import { useExamSubmittionStore } from "../../../../utils/hooks/use_exam_submittion";
import { useNavigationStore } from "../../../../utils/hooks/use_navigation_store";
import { useNotificationStore, type NotificationType } from "../../../../utils/hooks/use_notification_store";
import { useSelectedExam } from "../../../../utils/hooks/use_selected_exam";
import { useStudentAnswers } from "../../../../utils/hooks/use_student_answers";

export class AllExamOperations {
  static async startExam() {
    const navigate = useNavigationStore.getState().navigate;
    const { startTimer, allAvaliableQuestions, proceedExam } = useSelectedExam.getState();

    if (allAvaliableQuestions?.length === 0) {
      useNotificationStore.getState().showNotification("no question found refresh your browser", "info")
    } else {
      const state = await proceedExam()
      if (state) {
        navigate(AppUrl.startExam)
        setTimeout(() => {
          startTimer();
        }, 300);
      }
    }

  }

  static async submitExam({ message, messageType }: { message: string, messageType: NotificationType }) {
    const { submitExam,  } = useExamSubmittionStore.getState()
    
    await submitExam()
    useSelectedExam.getState().clear()
    useStudentAnswers.getState().clearAnswers()
    useNavigationStore.getState().navigate(AppUrl.examSelectionUrl)
    useNotificationStore.getState().showNotification(message, messageType)
  }

}
