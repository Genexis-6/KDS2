import { useEffect } from "react";
import { useSelectedExam } from "../../../../../utils/hooks/use_selected_exam";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { AppUrl } from "../../../../../common/routes/app_urls";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import { useAllSubjects } from "../../../../../utils/hooks/use_all_subjects";
import { useStudentInfoStore } from "../../../../../utils/hooks/use_student_info_store";
import { usePopupStore } from "../../../../../utils/hooks/use_pop_up_menu";
import { AllExamOperations } from "../../viewModel/allExamsOperation";
// import { useExamStarted } from "../../../../../utils/hooks/use_exam_started";

export default function ExamPreParation() {
  const {
    selectedExam, timer, isTimerRunning, clear, getExamStats, getAllAvaliableQuestions
  } = useSelectedExam()
  const { navigate } = useNavigationStore()
  const { subjects } = useAllSubjects()
  const { student } = useStudentInfoStore()
  const { showNotification } = useNotificationStore()
  const { openPopup, closePopup } = usePopupStore()
  //  const { state } = useExamStarted()

  useEffect(
    ()=>{
      getExamStats().then()
      getAllAvaliableQuestions().then()
    }, []
  )

  useEffect(
    () => {
      if (selectedExam === null) {
        navigate(AppUrl.examSelectionUrl)
        showNotification("choose an exam before proceeding", "info")

      }
    }, [
    selectedExam
  ]
  )

      useEffect(
        () => {
            if (isTimerRunning) {
                navigate(AppUrl.startExam)
            }
        }, [isTimerRunning]
    )

  return (
    <div className="exam-container mt-4">
      {/* Header Section */}
      <div className="w-100 text-center mb-4 border-bottom pb-3">
        <h2 className="mb-2 text-uppercase">Exam Preparation</h2>
        <p className="text-muted mb-1">
          <strong>Teacher:</strong> {selectedExam?.author}
        </p>
        <p className="text-muted mb-1">
          <strong>Class:</strong> {subjects?.className} - {selectedExam?.title}
        </p>
        <p className="text-muted">
          <strong>Exam Time: </strong>{" "}
          <b className="text-primary">

            {String(timer?.hr || 0).padStart(2, "0")} hr{": "}
            {String(timer?.mins || 0).padStart(2, "0")} min{": "}
            {String(timer?.sec || 0).padStart(2, "0")} sec{": "}
          </b>
        </p>

        <p className="text-muted mt-2">
          <strong>Student:</strong> {student?.fullName}
        </p>
      </div>

      {/* Exam Guidelines */}
      <div className="w-100 mb-4">
        <h5 className="fw-bold text-uppercase">Exam Guidelines</h5>
        <ul className="list-group list-group-flush">
          <li className="list-group-item bg-transparent border-0">
            Once you start the exam, you cannot go back.
          </li>
          <li className="list-group-item bg-transparent border-0">
            Do not refresh or close the browser during the exam.
          </li>
          <li className="list-group-item bg-transparent border-0">
            Submit before the timer runs out.
          </li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="w-100 d-flex justify-content-between mt-auto">
        <button className="btn btn-outline-secondary px-4" onClick={() => { 
          navigate(AppUrl.examSelectionUrl) 
          setTimeout(() => {
            clear()
          }, 300);
          }}>← Back</button>
        <button className="btn btn-primary px-4" onClick={() => {
          openPopup({
            title: "Confirm Action",
            message: "Once you start the exam, you cannot go back!",
            onContinue: async () => await AllExamOperations.startExam(),
            onCancel: () => closePopup(),
          })
        }}>Proceed →</button>
      </div>
    </div>
  );
}
