import { create } from "zustand";
import { ProceedExam, SubjectModel } from "../../common/model/classModels/subject_model";
import type { TimerModel } from "../../common/model/classModels/timer_model";
import { useIsAuthenticatedStore } from "./use_is_authenticated_store";
import { useAuthTokenStore } from "./use_auth_token_store";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { useNotificationStore } from "./use_notification_store";
import { AllServerUrls } from "../http/all_server_url";
import { AppUrl } from "../../common/routes/app_urls";
import { useNavigationStore } from "./use_navigation_store";
import type { QuestionModel } from "../../common/model/classModels/QuestionModel";
import { useStudentInfoStore } from "./use_student_info_store";
import { useExamStarted } from "./use_exam_started";




type UseSelectedExam = {
  allAvaliableQuestions: QuestionModel[] | null;
  selectedExam: SubjectModel | null;
  timer: TimerModel | null;
  isLoading: boolean;
  remainingTime: number;
  isTimerRunning: boolean;
  currentQuestionIndex: number
  proceedExam: () => Promise<boolean>
  setCurrentQuestionIndex: (index: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  setSelectedExam: (subject: SubjectModel) => void;
  getAllAvaliableQuestions: () => Promise<void>
  getExamStats: () => Promise<void>;
  startTimer: (onTimeUp?: () => void) => void;
  stopTimer: () => void;
  clear: () => void;
};

const SESSION_KEY = "selectedExam";
const TIMER_KEY = "remainingTime";
const TIMER_OBJECT_KEY = "timerObject";
const LAST_UPDATE_KEY = "lastUpdateTime";
const RUNNING_KEY = "isTimerRunning";
const ALLQUESTIONS = "allUqestions";
const CURRENT_QUESTION_KEY = "currentQuestionIndex";

let timerInterval: ReturnType<typeof setInterval> | null = null;

export const useSelectedExam = create<UseSelectedExam>((set, get) => ({
  allAvaliableQuestions: (() => {
    const store = sessionStorage.getItem(ALLQUESTIONS);
    if (!store) return null;
    try {
      return JSON.parse(store)
    } catch {
      sessionStorage.removeItem(ALLQUESTIONS);
      return null;
    }
  })(),
  selectedExam: (() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  })(),

  timer: (() => {
    const stored = sessionStorage.getItem(TIMER_OBJECT_KEY);
    return stored ? JSON.parse(stored) : null;
  })(),

  isLoading: false,
proceedExam: async () => {
  set({ isLoading: true });
  try {
    const { token } = useAuthTokenStore.getState();
    const { isAuthenticated } = useIsAuthenticatedStore.getState();
    const { selectedExam } = get();
    const { student } = useStudentInfoStore.getState();

    if (!token || !student?.id || !isAuthenticated || !selectedExam) {
      console.warn("Not able to check QA status");
      return false;
    }

    const dt = new ProceedExam({ subId: selectedExam.id, studId: student.id });
    return await requestProceedExam({ token, data: dt });
  } finally {
    set({ isLoading: false });
  }
},

  remainingTime: (() => {
    const storedTime = Number(sessionStorage.getItem(TIMER_KEY)) || 0;
    const lastUpdate = Number(sessionStorage.getItem(LAST_UPDATE_KEY)) || 0;
    if (storedTime && lastUpdate) {
      const diff = Math.floor((Date.now() - lastUpdate) / 1000);
      return Math.max(storedTime - diff, 0);
    }
    return storedTime;
  })(),

  isTimerRunning: sessionStorage.getItem(RUNNING_KEY) === "true",

  setSelectedExam: (subject) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(subject));
    set({ selectedExam: subject });
  },
  getAllAvaliableQuestions: async () => {
    const { isAuthenticated } = useIsAuthenticatedStore.getState();
    const { token } = useAuthTokenStore.getState();
    const { selectedExam } = get();
    if (!isAuthenticated) return console.warn("Student not authenticated!");

    try {
      set({ isLoading: true })
      const newQuest = await requestQuestions({ token: token!, subjectId: selectedExam?.id! })
      if (newQuest) {
        sessionStorage.setItem(ALLQUESTIONS, JSON.stringify(newQuest))
        set({ allAvaliableQuestions: newQuest })
      }

    } catch (e) {
      console.error("an error occured while getting question: ", e)
    } finally {
      set({ isLoading: false })
    }
  },
  getExamStats: async () => {
    const { selectedExam } = get();
    const { isAuthenticated } = useIsAuthenticatedStore.getState();
    const { token } = useAuthTokenStore.getState();

    if (!selectedExam) return console.warn("No exam selected!");
    if (!isAuthenticated) return console.warn("Student not authenticated!");

    try {
      set({ isLoading: true });

      const newTimer = await requestTimer({
        token: token!,
        subjectId: selectedExam.id,
      });

      if (newTimer) {
        sessionStorage.setItem(TIMER_OBJECT_KEY, JSON.stringify(newTimer));

        const totalSeconds = newTimer.hr * 3600 + newTimer.mins * 60 + newTimer.sec;
        sessionStorage.setItem(TIMER_KEY, totalSeconds.toString());
        sessionStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());

        set({ timer: newTimer, remainingTime: totalSeconds });
      }
    } catch (error) {
      console.error("Failed to fetch exam timer:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  startTimer: (onTimeUp) => {
    if (timerInterval) clearInterval(timerInterval);

    // ✅ Mark timer as running (persistent)
    sessionStorage.setItem(RUNNING_KEY, "true");
    set({ isTimerRunning: true });
    useExamStarted.getState().setState(true)

    timerInterval = setInterval(() => {
      const { remainingTime } = get();
      if (remainingTime <= 1) {
        clearInterval(timerInterval!);
        timerInterval = null;

        sessionStorage.removeItem(TIMER_KEY);
        sessionStorage.removeItem(LAST_UPDATE_KEY);
        sessionStorage.removeItem(RUNNING_KEY);

        set({ remainingTime: 0, isTimerRunning: false });
        useExamStarted.getState().setState(false)

        if (onTimeUp) onTimeUp();
        return;
      }

      const newTime = remainingTime - 1;
      sessionStorage.setItem(TIMER_KEY, newTime.toString());
      sessionStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
      set({ remainingTime: newTime });
    }, 1000);
  },

  stopTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    sessionStorage.removeItem(RUNNING_KEY);
    set({ isTimerRunning: false });
  },


  // all question operation logic

  currentQuestionIndex:
    Number(sessionStorage.getItem(CURRENT_QUESTION_KEY)) || 0,

  setCurrentQuestionIndex: (index: number) => {
    const { allAvaliableQuestions } = get();
    if (!allAvaliableQuestions) return;

    const clampedIndex = Math.max(0, Math.min(index, allAvaliableQuestions.length - 1));
    sessionStorage.setItem(CURRENT_QUESTION_KEY, clampedIndex.toString());
    set({ currentQuestionIndex: clampedIndex });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, allAvaliableQuestions } = get();
    if (!allAvaliableQuestions) return;

    const nextIndex = Math.min(currentQuestionIndex + 1, allAvaliableQuestions.length - 1);
    sessionStorage.setItem(CURRENT_QUESTION_KEY, nextIndex.toString());
    set({ currentQuestionIndex: nextIndex });
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    const prevIndex = Math.max(currentQuestionIndex - 1, 0);
    sessionStorage.setItem(CURRENT_QUESTION_KEY, prevIndex.toString());
    set({ currentQuestionIndex: prevIndex });
  },


  clear: () => {
    if (timerInterval) clearInterval(timerInterval);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TIMER_KEY);
    sessionStorage.removeItem(LAST_UPDATE_KEY);
    sessionStorage.removeItem(TIMER_OBJECT_KEY);
    sessionStorage.removeItem(RUNNING_KEY);
    sessionStorage.removeItem(ALLQUESTIONS)
    sessionStorage.removeItem(CURRENT_QUESTION_KEY)

    set({
      selectedExam: null,
      timer: null,
      isLoading: false,
      remainingTime: 0,
      isTimerRunning: false,
    });
  },
}));

async function requestTimer({
  token,
  subjectId,
}: {
  token: string;
  subjectId: string;
}) {
  const { showNotification } = useNotificationStore.getState();
  const { navigate } = useNavigationStore.getState();

  const url = `${AllServerUrls.getExamTime}?subject_id=${subjectId}`;
  const res = await DefaultRequestSetUp.get<TimerModel>({ url, token });

  if (res.statusCode === 404) {
    showNotification("No timer set for this exam", "info");
    return null;
  }

  if (res.statusCode === 500) {
    showNotification(res.message || "Server error", "error");
    return null;
  }

  navigate(AppUrl.examPreparation);
  return res.data;
}


async function requestQuestions({ token, subjectId }: { token: string, subjectId: string }) {
  var res = await DefaultRequestSetUp.get<QuestionModel[]>({ url: `${AllServerUrls.getAllQuestion}?subject_id=${subjectId}`, token: token })

  
  if (res.statusCode === 500) {
    useNotificationStore.getState().showNotification(res.message, "error")
    return null
  }

  return res.data
}



async function requestProceedExam({token, data}:{token:string, data:ProceedExam}) {
  var res = await DefaultRequestSetUp.post<ProceedExam, boolean>({url:AllServerUrls.checkProceedExam, token:token, data:data})
  if(res.statusCode === 400){
    useNotificationStore.getState().showNotification(res.message, "error")
  
  }
  return res.data
}