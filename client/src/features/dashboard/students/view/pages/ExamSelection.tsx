import { useEffect } from "react";
import Spinner from "../../../../../common/component/Spinner";
import { useAllSubjects } from "../../../../../utils/hooks/use_all_subjects";
import ExamCard from "../components/ExamCards";
import ExamHeading from "../components/ExamHeading";
import "../styles/exam_select_style.css";
import { useStudentAnswers } from "../../../../../utils/hooks/use_student_answers";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { AppUrl } from "../../../../../common/routes/app_urls";
import { useSelectedExam } from "../../../../../utils/hooks/use_selected_exam";
import { useStudentInfoStore } from "../../../../../utils/hooks/use_student_info_store";
import { useAuthTokenStore } from "../../../../../utils/hooks/use_auth_token_store";


export default function ExamSelection() {
  const { subjects, getSubjects } = useAllSubjects();
  const { isTimerRunning } = useSelectedExam();
  const { navigate } = useNavigationStore();
  const { student } = useStudentInfoStore();
  const {getAcessToken} = useAuthTokenStore()

  useEffect(() => {
    useStudentAnswers.getState().clearAnswers();
    getAcessToken().then()
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      navigate(AppUrl.startExam);
    }
  }, [isTimerRunning]);

  // 🔄 Automatically re-fetch subjects when student is available
  useEffect(() => {
    if (student && (!subjects || subjects?.subjects?.length === 0)) {
      getSubjects?.(); // Assuming your hook provides a refetch function
    }
  }, [student]);

  // 💡 Or trigger a reload-like effect
  useEffect(() => {
    if (student && subjects) {
      console.log("Both student and subjects available, refreshing view...");
      // You can trigger a state update or data refresh here
    }
  }, [student, subjects]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 h-100">
          <div className="row">
            <div className="col-12">
              <ExamHeading
                className={subjects?.className}
                teacherName={subjects?.teacherName}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="exam-container">
                {subjects?.subjects?.length === 0 ? (
                  <>
                    <Spinner message="up able to get questions... inform the technical team" />
                  </>
                ) : (
                  subjects?.subjects?.map((sub, key) => (
                    <ExamCard subject={sub} key={key} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
