import { useAllSubjects } from "../../utils/hooks/use_all_subjects";
import { useAuthTokenStore } from "../../utils/hooks/use_auth_token_store";
import { useCurrentUserStore } from "../../utils/hooks/use_current_user";
import { useIsAuthenticatedStore } from "../../utils/hooks/use_is_authenticated_store";
import { useNavigationStore } from "../../utils/hooks/use_navigation_store";
import { useNotificationStore } from "../../utils/hooks/use_notification_store";
import { useSelectedExam } from "../../utils/hooks/use_selected_exam";
import { useStudentInfoStore } from "../../utils/hooks/use_student_info_store";
import { AllServerUrls } from "../../utils/http/all_server_url";
import { DefaultRequestSetUp } from "../../utils/http/default_request_set_up";
import { AppUrl } from "../routes/app_urls";

export default async function HandleLogout() {
    try {
        const { setUser } = useCurrentUserStore.getState();
        const { clearStudentInfo } = useStudentInfoStore.getState()
        const { clearToken } = useAuthTokenStore.getState()
        const { logout, setIsAuthenticatedStatus } = useIsAuthenticatedStore.getState();
        const { showNotification } = useNotificationStore.getState()
        const { clear } = useSelectedExam.getState()
        const { navigate } = useNavigationStore.getState()
        
        // Call logout API
        var res = await DefaultRequestSetUp.get({ url: AllServerUrls.logout })

        // Clear all states
        logout();
        setUser(null);
        setIsAuthenticatedStatus(false);
        useAllSubjects.getState().clearSub()
        clearStudentInfo()
        clear()
        
        // Clear all storage
        sessionStorage.clear()
        localStorage.clear() // Also clear localStorage if needed
        clearToken()
        
        // Show notification
        showNotification(res.message, "success")
        
        // Navigate to login
        navigate(AppUrl.login)
        
        // Force full page reload after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 100); // Small delay to ensure navigation happens
        
    } catch (error) {
        console.error("Logout error:", error);
        window.location.href = AppUrl.login;
        window.location.reload();
    }
}

