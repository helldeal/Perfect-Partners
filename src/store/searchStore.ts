import { create } from "zustand";

interface SearchStore {
  query: string;
  setQuery: (query: string) => void;
}

const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
}));

export default useSearchStore;
