import { create } from "zustand";
import type { ClassModel } from "../../common/model/classModels/class_model";
import { HandleClassRequests } from "../../common/viewModel/classRequests/handle_class_requests";

type useAllClassStoreParam = {
    allClass: ClassModel[],
    getLatestUpdate: () => Promise<void>

}


export const useAllClassStore = create<useAllClassStoreParam>((set) => (
    {
        allClass: [], getLatestUpdate: async () => {
            const dt = await HandleClassRequests.getAllClass();
            set({ allClass: dt! })
        }
    }
))