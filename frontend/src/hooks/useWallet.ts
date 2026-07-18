"use client"

import { useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { walletApi } from "@/lib/api"
import type { Wallet, Transaction, ApiResponse, PaginatedResponse } from "@/types"

const QUERY_KEYS = {
  wallets: ["wallets"] as const,
  transactions: ["wallets", "transactions"] as const,
}

export function useWallet() {
  const queryClient = useQueryClient()
  const walletErrorRef = useRef<string | null>(null)

  const {
    address,
    isConnected,
    chain,
    chainId,
    connector,
  } = useAccount()

  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()

  const walletsQuery = useQuery<ApiResponse<Wallet[]>>({
    queryKey: QUERY_KEYS.wallets,
    queryFn: () => walletApi.getWallets(),
    enabled: isConnected,
  })

  const transactionsQuery = useQuery<PaginatedResponse<Transaction>>({
    queryKey: QUERY_KEYS.transactions,
    queryFn: () => walletApi.getTransactions(),
    enabled: isConnected,
  })

  const connectMutation = useMutation({
    mutationFn: async ({ address, chainId }: { address: string; chainId: number }) => {
      return walletApi.connect(address, chainId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets })
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (walletId: string) => walletApi.disconnect(walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets })
    },
  })

  const handleConnect = async (connectorIndex: number = 0) => {
    try {
      const result = await connectAsync({ connector: connectors[connectorIndex] })
      if (result && chainId) {
        await connectMutation.mutateAsync({
          address: result.accounts[0],
          chainId,
        })
      }
    } catch (error) {
      walletErrorRef.current = `Wallet connection failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  const handleDisconnect = async (walletId?: string) => {
    try {
      if (walletId) {
        await disconnectMutation.mutateAsync(walletId)
      }
      await disconnectAsync()
    } catch (error) {
      walletErrorRef.current = `Wallet disconnection failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  return {
    address,
    isConnected,
    chain,
    chainId,
    wallets: walletsQuery.data?.data || [],
    transactions: transactionsQuery.data?.items || [],
    isLoading: walletsQuery.isLoading || transactionsQuery.isLoading,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain: switchChainAsync,
    connectors,
  }
}
