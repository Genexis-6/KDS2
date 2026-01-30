import { create } from "zustand";



const EXAM_STARTED_KEY = 'exmState';

type useExamStarted = {
    state: boolean
    setState: (val: boolean) => void
    clearState: () => void
}



export const useExamStarted = create<useExamStarted>((set) => (
    {
        state: sessionStorage.getItem(EXAM_STARTED_KEY) === "true",
        setState: (value: boolean) => {
            sessionStorage.setItem(EXAM_STARTED_KEY, String(value))
            set({ state: value })
        },
        clearState: () => {
            sessionStorage.removeItem(EXAM_STARTED_KEY)
        }
    }
))