import { useEffect } from "react";
import { useSelectedExam } from "../../../../../utils/hooks/use_selected_exam";
import { AllExamOperations } from "../../viewModel/allExamsOperation";


export default function TimerCard() {
  const { remainingTime, startTimer, isTimerRunning } = useSelectedExam();


  useEffect(() => {
    if (isTimerRunning) {
      startTimer(async () => {
        await AllExamOperations.submitExam({message:"You where timed out", messageType:"info"})
      });
      
    }
  }, [isTimerRunning]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="col-12">
      <div className="timer-component text-white bg-primary text-center p-3 rounded shadow-sm">
        <h4 className="mb-0">
          Time Remaining:{" "}
          <span className="fw-bold">
            {remainingTime > 0 ? formatTime(remainingTime) : "00:00:00"}
          </span>
        </h4>
      </div>
    </div>
  );
}
