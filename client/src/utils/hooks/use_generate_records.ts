import { GenerateRecord } from "../../features/dashboard/admin/model/generate_record_model"
import { AllServerUrls } from "../http/all_server_url"
import { DefaultRequestSetUp } from "../http/default_request_set_up"
import { useAuthTokenStore } from "./use_auth_token_store"
import { useIsAuthenticatedStore } from "./use_is_authenticated_store"
import { useNotificationStore } from "./use_notification_store"
import type { StudentSubInfo } from "./use_subject_full_info"
import { create } from "zustand"


type useGenerateRecord = {
    generateState: boolean,
    sendStudentRecord: (record: StudentSubInfo[], subject:string) => Promise<void>
}



export const useGenerateRecordStore = create<useGenerateRecord>(
    (set) => (
        {
            generateState: false,
            sendStudentRecord: async (record, subject) => {
                const { token } = useAuthTokenStore.getState()
                const { isAuthenticated } = useIsAuthenticatedStore.getState()

                if (!isAuthenticated) return console.warn("user is not authenticated")

                const className = sessionStorage.getItem('currentClass')
                if (className?.trim() === "") return console.warn("no class was selected")

                const dt = new GenerateRecord({ className: className!, students: record, subject: subject })

                try {
                    set({ generateState: true })

                    var res = await DefaultRequestSetUp.post<GenerateRecord, boolean>({ url: AllServerUrls.generateRecord, data: dt, token: token! })
                    useNotificationStore.getState().showNotification(res.message, res.statusCode === 200 ? "success" : "info")

                } catch (error) {

                } finally {
                    set({ generateState: false })
                }
            }
        }
    )
)


