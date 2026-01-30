import { useAuthTokenStore } from "../../../utils/hooks/use_auth_token_store";
import { useIsAuthenticatedStore } from "../../../utils/hooks/use_is_authenticated_store";
import { AllServerUrls } from "../../../utils/http/all_server_url";
import { DefaultRequestSetUp } from "../../../utils/http/default_request_set_up";
import type { ClassModel } from "../../model/classModels/class_model";



export class HandleClassRequests{
    
    static async getAllClass() {
        const {token} = useAuthTokenStore.getState()
        const {isAuthenticated} = useIsAuthenticatedStore.getState()

        if(!isAuthenticated) return console.warn("user not authenticated")
        const res = await DefaultRequestSetUp.get<ClassModel[]>({url:AllServerUrls.getAllClassUlr, token:token!})
        
        return res.data
    }
}