import { create } from "zustand";




type useLoadingState = {
    isLoading: boolean
    setLoadingState: (val: boolean) => void
}



export const useLoadingStore = create<useLoadingState>(
    (set) => (
        { isLoading: false, setLoadingState: (vale) => { set({ isLoading: vale }) } }
    )
)