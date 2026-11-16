import { create } from "zustand";
import type { SearchRequest } from "../types";

interface ExplorerState {
  search: SearchRequest;
  setSearch: (search: SearchRequest) => void;
}

export const DEFAULT_SEARCH: SearchRequest = {
  ra: 127.69444,
  dec: -39.1776,
  radius: 0.01,
  collection: "spherex_dr1",
};

export const useExplorerStore = create<ExplorerState>((set) => ({
  search: DEFAULT_SEARCH,
  setSearch: (search) => set({ search }),
}));
