import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Wallet Store
 * Manages Web3 wallet connection state.
 */

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  error: string | null;

  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setBalance: (balance: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  connect: (address: string, chainId: number) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools((set) => ({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    balance: null,
    error: null,

    setAddress: (address) => set({ address }),
    setChainId: (chainId) => set({ chainId }),
    setBalance: (balance) => set({ balance }),
    setConnecting: (isConnecting) => set({ isConnecting }),
    setError: (error) => set({ error }),

    connect: (address, chainId) =>
      set({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: null,
      }),

    disconnect: () =>
      set({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        balance: null,
        error: null,
      }),
  }))
);
