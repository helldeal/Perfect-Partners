import { create } from "zustand";

interface ModalStore {
  isModalOpen: boolean;
  showContent: boolean;
  payload: any;
  openModal: (payload: any) => void;
  closeModal: () => void;
  setShowContent: (show: boolean) => void;
}

const useModalStore = create<ModalStore>((set) => ({
  isModalOpen: false,
  showContent: false,
  payload: null,
  openModal: (payload) => set({ isModalOpen: true, payload }),
  closeModal: () => set({ isModalOpen: false, payload: null }),
  setShowContent: (show) => set({ showContent: show }),
}));

export default useModalStore;
