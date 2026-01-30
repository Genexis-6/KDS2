// store/notificationStore.ts
import { create } from "zustand";

export type NotificationType = "success" | "error" | "info";

interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: "",
  type: "info",
  visible: false,
  showNotification: (message, type = "info") => {
    set({ message, type, visible: true });

    // Auto hide after 3 seconds
    setTimeout(() => {
      set({ visible: false });
    }, 3000);
  },
  hideNotification: () => set({ visible: false }),
}));
