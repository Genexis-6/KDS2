// components/GlobalNotification.tsx
import React from "react";
import { useNotificationStore } from "../../utils/hooks/use_notification_store";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";


export const notificationBg = {
    success: "rgba(40, 167, 69, 0.85)",
    error: "rgba(220, 53, 69, 0.85)",
    info: "rgba(13, 110, 253, 0.85)",
};


const notificationStyles = {
    success: { bg: notificationBg.success, icon: <CheckCircle size={20} />, label: "Success" },
    error: { bg: notificationBg.error, icon: <AlertCircle size={20} />, label: "Error" },
    info: { bg: notificationBg.info, icon: <Info size={20} />, label: "Info" },
};

export const GlobalNotification: React.FC = () => {
    const { message, type, visible, hideNotification } = useNotificationStore();
    const { bg, icon } = notificationStyles[type ?? "info"];


    return (
        <div
            className="position-fixed bottom-0 end-0 m-4 rounded shadow-lg"
            style={{
                transform: visible ? "translateY(0)" : "translateY(100px)",
                opacity: visible ? 1 : 0,
                transition: "all 0.3s ease-in-out",
                minWidth: "280px",
                zIndex: 9999,
            }}
        >
            <div
                className="d-flex align-items-center justify-content-between p-3 rounded text-white"
                style={{ backgroundColor: bg }}
            >
                <div className="d-flex align-items-center">
                    <div className="me-2">{icon}</div>
                    <div>
                 
                        {message}
                    </div>
                </div>
                <div
                    style={{ cursor: "pointer" }}
                    onClick={hideNotification}
                >
                    <X size={18} />
                </div>
            </div>
        </div>
    );
};
