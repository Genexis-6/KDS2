import { create } from "zustand";

const IN_PROGRESS_KEY = "inprogress";

type UseClassCreation = {
  inProgress: boolean;
  setProgress: (val: boolean) => void;
};

export const useClassCreationStore = create<UseClassCreation>((set) => ({
  inProgress: sessionStorage.getItem(IN_PROGRESS_KEY) === "true",
  setProgress: (val) => {
    sessionStorage.setItem(IN_PROGRESS_KEY, String(val));
    set({ inProgress: val });
  },
}));
