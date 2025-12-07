import { create } from "zustand";

interface ModalStore {
  isModalOpen: boolean;
  showContent: boolean;
  payload: any;
  openModal: (payload: any) => void;
  closeModal: () => void;
  setShowContent: (show: boolean) => void;
  updatePayload: (updates: Partial<any>) => void;
}

const useModalStore = create<ModalStore>((set) => ({
  isModalOpen: false,
  showContent: false,
  payload: null,
  openModal: (payload) => set({ isModalOpen: true, payload }),
  closeModal: () => set({ isModalOpen: false, payload: null }),
  setShowContent: (show) => set({ showContent: show }),
  updatePayload: (updates) =>
    set((state) => ({
      payload: state.payload ? { ...state.payload, ...updates } : state.payload,
    })),
}));

export default useModalStore;
