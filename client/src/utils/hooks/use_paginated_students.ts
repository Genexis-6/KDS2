import { create } from "zustand";
import { DefaultRequestSetUp } from "../http/default_request_set_up";
import { AllServerUrls } from "../http/all_server_url";
import { useAuthTokenStore } from "./use_auth_token_store";

export interface PaginatedStudent {
  id: string;
  fullName: string;
  identifier: string;
  classId: string;
  hasActiveSession: boolean;
}

interface PaginatedStudentsResponse {
  items: PaginatedStudent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type UsePaginatedStudents = {
  students: PaginatedStudent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchStudents: (params: { classId: string; page?: number; search?: string }) => Promise<void>;
  goToPage: (classId: string, page: number) => Promise<void>;
  clear: () => void;
};

const PAGE_SIZE = 20;

export const usePaginatedStudentsStore = create<UsePaginatedStudents>((set, get) => ({
  students: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  isLoading: false,
  searchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchStudents: async ({ classId, page = 1, search }) => {
    const { token } = useAuthTokenStore.getState();
    if (!token) return;

    set({ isLoading: true });

    const searchTerm = search !== undefined ? search : get().searchTerm;
    const params = new URLSearchParams({
      classId,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (searchTerm) params.set("search", searchTerm);

    try {
      const res = await DefaultRequestSetUp.get<PaginatedStudentsResponse>({
        url: `${AllServerUrls.getClassStudents}?${params.toString()}`,
        token,
      });

      if (res.statusCode === 200 && res.data) {
        set({
          students: res.data.items,
          total: res.data.total,
          page: res.data.page,
          pageSize: res.data.pageSize,
          totalPages: res.data.totalPages,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  goToPage: async (classId, page) => {
    await get().fetchStudents({ classId, page });
  },

  clear: () => set({ students: [], total: 0, page: 1, totalPages: 0, searchTerm: "" }),
}));
