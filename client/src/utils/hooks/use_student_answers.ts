import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StudentAnswer {
  id: string;      
  answer: string; 
}

type StudentAnswerStore = {
  allUserAnswers: StudentAnswer[];
  setAnswer: (id: string, answer: string) => void;
  getAnswer: (id: string) => string | null;
  checkAnswered: (id: string) => boolean;
  clearAnswers: () => void;
};

export const useStudentAnswers = create<StudentAnswerStore>()(
  persist(
    (set, get) => ({
      allUserAnswers: [],

      //  Add or update an answer
      setAnswer: (id, answer) =>
        set((state) => {
          const existing = state.allUserAnswers.find((a) => a.id === id);
          if (existing) {
            // update existing answer
            return {
              allUserAnswers: state.allUserAnswers.map((a) =>
                a.id === id ? { ...a, answer } : a
              ),
            };
          } else {
            // add new answer
            return {
              allUserAnswers: [...state.allUserAnswers, { id, answer }],
            };
          }
        }),

      //  Get a specific answer
      getAnswer: (id) => {
        const found = get().allUserAnswers.find((a) => a.id === id);
        return found ? found.answer : null;
      },

      //  Check if answered
      checkAnswered: (id) => get().allUserAnswers.some((a) => a.id === id),

      //Clear all
      clearAnswers: () => set({ allUserAnswers: [] }),
    }),
    {
      name: "student-answers-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
