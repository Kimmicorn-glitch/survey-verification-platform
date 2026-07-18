import { apiClient } from "./api"
import type { User, AuthTokens } from "@/types"

const TOKEN_KEY = "auth_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const USER_KEY = "auth_user"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAuthData(tokens: AuthTokens, user: User): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  apiClient.setAccessToken(tokens.accessToken)
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  apiClient.setAccessToken(null)
}

export function initializeAuth(): void {
  const token = getStoredToken()
  if (token) {
    apiClient.setAccessToken(token)
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await apiClient.post<{
      success: boolean
      data: { accessToken: string; expiresIn: number }
    }>("/auth/refresh", { refreshToken })

    if (response.success) {
      localStorage.setItem(TOKEN_KEY, response.data.accessToken)
      apiClient.setAccessToken(response.data.accessToken)
      return response.data.accessToken
    }
  } catch {
    clearAuthData()
  }
  return null
}
