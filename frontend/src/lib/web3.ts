import { mainnet, polygon, arbitrum, base } from "wagmi/chains"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { walletConnect, injected, safe } from "wagmi/connectors"

export const wagmiConfig = getDefaultConfig({
  appName: "Survey Verification Platform",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [mainnet, polygon, arbitrum, base],
  ssr: true,
})

export const supportedChains = [mainnet, polygon, arbitrum, base] as const

export function getChainById(chainId: number) {
  return supportedChains.find((chain) => chain.id === chainId)
}

export function getBlockExplorerUrl(chainId: number, hash: string): string {
  const chain = getChainById(chainId)
  if (!chain) return ""
  return `${chain.blockExplorers?.default.url}/tx/${hash}`
}

export function getContractUrl(chainId: number, address: string): string {
  const chain = getChainById(chainId)
  if (!chain) return ""
  return `${chain.blockExplorers?.default.url}/address/${address}`
}

export function formatAddressForDisplay(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function getChainName(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.name || "Unknown"
}

export function getChainCurrency(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.nativeCurrency?.symbol || "ETH"
}
