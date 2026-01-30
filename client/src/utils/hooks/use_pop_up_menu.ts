import { create } from "zustand";

type PopupState = {
  isOpen: boolean;
  title: string;
  message: string;
  onContinue?: () => void;
  onCancel?: () => void;
  openPopup: (params: {
    title: string;
    message: string;
    onContinue?: () => void;
    onCancel?: () => void;
  }) => void;
  closePopup: () => void;
};

export const usePopupStore = create<PopupState>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  onContinue: undefined,
  onCancel: undefined,

  openPopup: ({ title, message, onContinue, onCancel }) =>
    set({ isOpen: true, title, message, onContinue, onCancel }),

  closePopup: () =>
    set({ isOpen: false, title: "", message: "", onContinue: undefined, onCancel: undefined }),
}));
