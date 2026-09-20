import { useAuthTokenStore } from "../../utils/hooks/use_auth_token_store";
import { useNavigationStore } from "../../utils/hooks/use_navigation_store";
import { useNotificationStore } from "../../utils/hooks/use_notification_store";
import { AllServerUrls } from "../../utils/http/all_server_url";
import { DefaultRequestSetUp } from "../../utils/http/default_request_set_up";
import { AppUrl } from "../routes/app_urls";
import { clearClientSession } from "./session_expiry";

export default async function HandleLogout() {
    try {
        const { showNotification } = useNotificationStore.getState()
        const { navigate } = useNavigationStore.getState()
        const { token } = useAuthTokenStore.getState()

        // Call logout API
        var res = await DefaultRequestSetUp.get({ url: AllServerUrls.logout, token: token ?? undefined })

        // Clear all states + storage
        clearClientSession()

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
