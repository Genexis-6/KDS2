import { useAllSubjects } from "../../utils/hooks/use_all_subjects";
import { useAuthTokenStore } from "../../utils/hooks/use_auth_token_store";
import { useCurrentUserStore } from "../../utils/hooks/use_current_user";
import { useIsAuthenticatedStore } from "../../utils/hooks/use_is_authenticated_store";
import { useNotificationStore } from "../../utils/hooks/use_notification_store";
import { useSelectedExam } from "../../utils/hooks/use_selected_exam";
import { useStudentInfoStore } from "../../utils/hooks/use_student_info_store";
import { AuthInterceptors } from "../../utils/http/auth_interceptors";
import { AppUrl } from "../routes/app_urls";

const SESSION_ENDED_NOTICE_KEY = "sessionEndedNotice";

/** Wipes all client-side auth + exam state. Shared by manual logout and a forced session end. */
export function clearClientSession() {
    useCurrentUserStore.getState().setUser(null);
    useStudentInfoStore.getState().clearStudentInfo();
    useIsAuthenticatedStore.getState().logout();
    useIsAuthenticatedStore.getState().setIsAuthenticatedStatus(false);
    useAllSubjects.getState().clearSub();
    useSelectedExam.getState().clear(); // also stops a running exam timer
    useAuthTokenStore.getState().clearToken();

    sessionStorage.clear();
    localStorage.clear();
}

/**
 * Runs when the refresh-token interceptor learns the login is over (refresh
 * returned 401). The server has already deleted the student's session; this
 * clears the client side and does a full reload onto the login page so no
 * timers or in-memory state survive. The message is stashed in sessionStorage
 * (after the wipe) because the reload would otherwise lose the notification.
 */
function handleSessionEnded(message: string) {
    clearClientSession();
    sessionStorage.setItem(SESSION_ENDED_NOTICE_KEY, message);
    window.location.replace(AppUrl.login);
}

/** Call once at startup, before the app renders. */
export function setupAuthInterceptors() {
    AuthInterceptors.setSessionEndedHandler(handleSessionEnded);

    // Show the reason left behind by the page that was just torn down.
    const notice = sessionStorage.getItem(SESSION_ENDED_NOTICE_KEY);
    if (notice) {
        sessionStorage.removeItem(SESSION_ENDED_NOTICE_KEY);
        useNotificationStore.getState().showNotification(notice, "info");
    }
}
