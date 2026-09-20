// components/GlobalNotification.tsx
import React from "react";
import { useNotificationStore } from "../../utils/hooks/use_notification_store";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";


// Kept for any code that still imports it; the toast itself is styled in index.css (.cbx-toast).
export const notificationBg = {
    success: "#0F7A5C",
    error: "#B3314B",
    info: "#0F63A6",
};


const notificationStyles = {
    success: { icon: <CheckCircle size={18} />, tone: "cbx-toast-success" },
    error: { icon: <AlertCircle size={18} />, tone: "cbx-toast-error" },
    info: { icon: <Info size={18} />, tone: "cbx-toast-info" },
};

export const GlobalNotification: React.FC = () => {
    const { message, type, visible, hideNotification } = useNotificationStore();
    const { icon, tone } = notificationStyles[type ?? "info"];

    return (
        <div
            className={`cbx-toast ${tone} ${visible ? "show" : ""}`}
            role={type === "error" ? "alert" : "status"}
            aria-live={type === "error" ? "assertive" : "polite"}
        >
            <span className="cbx-toast-icon" aria-hidden="true">{icon}</span>
            <div className="cbx-toast-msg">{message}</div>
            <button type="button" className="cbx-toast-close" onClick={hideNotification} aria-label="Dismiss">
                <X size={16} />
            </button>
        </div>
    );
};
