import type { FieldValues, UseFormSetError } from "react-hook-form"
import type { FormValues } from "../pages/Login"
import { DefaultRequestSetUp } from "../../../../utils/http/default_request_set_up"
import { LoginModel } from "../../model/login_model"
import { AllServerUrls } from "../../../../utils/http/all_server_url"
import { useNotificationStore } from "../../../../utils/hooks/use_notification_store"
import { useAuthTokenStore } from "../../../../utils/hooks/use_auth_token_store"
import { useIsAuthenticatedStore } from "../../../../utils/hooks/use_is_authenticated_store"
import { useCurrentUserStore } from "../../../../utils/hooks/use_current_user"
import { useNavigationStore } from "../../../../utils/hooks/use_navigation_store"
import { AppUrl } from "../../../../common/routes/app_urls"
import { useStudentInfoStore } from "../../../../utils/hooks/use_student_info_store"


type loginParams<T extends FieldValues> = {
    data: FormValues
    setError: UseFormSetError<T>
}


export interface loginResInterface {
    accessToken: string
}




export class HandleFormSubmission {
    static async login({ data, setError }: loginParams<FormValues>) {
        const { showNotification } = useNotificationStore.getState()
        const { setToken } = useAuthTokenStore.getState()
        const { getUser } = useCurrentUserStore.getState()
        const { navigate } = useNavigationStore.getState()
        const { setIsAuthenticatedStatus } = useIsAuthenticatedStore.getState()
        const { getStudentInfo } = useStudentInfoStore.getState()
        const userData = new LoginModel(data);
        const res = await DefaultRequestSetUp.post<LoginModel, loginResInterface>({
            data: userData, url: AllServerUrls.login,
        })
        if (res.statusCode === 404) {
            setError("identifier", {
                message: res.message
            })
        } else if (res.statusCode === 403) {
            setError("password", {
                message: res.message
            })
        }
        else if (res.statusCode === 200) {
            setToken(res.data.accessToken);
            setIsAuthenticatedStatus(true)
            await getUser()
            if (data.role === "student") await getStudentInfo()
            showNotification(res.message, "success")
            navigate(data.role === "admin" ? AppUrl.adminPath : AppUrl.examSelectionUrl)
        }
    }
}