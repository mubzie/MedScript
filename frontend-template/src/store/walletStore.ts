import { create } from "zustand";
import type { MidenAccount, WalletState } from "@/types";

interface WalletStore extends WalletState {
  setConnected: (connected: boolean) => void;
  setAccount: (account: MidenAccount | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  connected: false,
  account: null,
  connecting: false,
  error: null,

  setConnected: (connected) => set({ connected }),
  setAccount: (account) => set({ account }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),

  disconnect: () =>
    set({
      connected: false,
      account: null,
      error: null,
    }),
}));
