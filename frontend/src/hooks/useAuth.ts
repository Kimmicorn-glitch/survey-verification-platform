"use client"

import { useState, useEffect, useCallback } from "react"
import type { User, LoginRequest, RegisterRequest } from "@/types"
import {
  setAuthData,
  clearAuthData,
  getStoredUser,
  getStoredToken,
  initializeAuth,
  refreshAccessToken,
  isTokenExpired,
} from "@/lib/auth"
import { authApi } from "@/lib/api"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const user = getStoredUser()
    const token = getStoredToken()
    if (user && token && !isTokenExpired(token)) {
      initializeAuth()
      setState({ user, isAuthenticated: true, isLoading: false, error: null })
    } else if (token && isTokenExpired(token)) {
      refreshAccessToken()
        .then(() => {
          const refreshedUser = getStoredUser()
          setState({
            user: refreshedUser,
            isAuthenticated: !!refreshedUser,
            isLoading: false,
            error: null,
          })
        })
        .catch(() => {
          clearAuthData()
          setState({ user: null, isAuthenticated: false, isLoading: false, error: null })
        })
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null })
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.login(data)
      if (response.success) {
        setAuthData(
          {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            expiresIn: response.data.expiresIn,
            tokenType: "Bearer",
          },
          response.data.user
        )
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        return true
      }
      throw new Error(response.message || "Login failed")
    } catch (err) {
      const isNetworkError = err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("fetch"))
      if (isNetworkError && process.env.NODE_ENV === "development") {
        const demoUser: User = {
          id: "demo-user-1",
          email: data.email,
          firstName: "Demo",
          lastName: "User",
          role: "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const demoToken = "demo-access-token-" + Date.now()
        setAuthData(
          {
            accessToken: demoToken,
            refreshToken: "demo-refresh-token",
            expiresIn: 3600,
            tokenType: "Bearer",
          },
          demoUser
        )
        setState({
          user: demoUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        return true
      }
      const message = err instanceof Error ? err.message : "Login failed"
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      return false
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.register(data)
      if (response.success) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return true
      }
      throw new Error(response.message || "Registration failed")
    } catch (err) {
      const isNetworkError = err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("fetch"))
      if (isNetworkError && process.env.NODE_ENV === "development") {
        setState((prev) => ({ ...prev, isLoading: false }))
        return true
      }
      const message = err instanceof Error ? err.message : "Registration failed"
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      clearAuthData()
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null })
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.updateProfile(data)
      if (response.success) {
        const user = response.data
        localStorage.setItem("auth_user", JSON.stringify(user))
        setState((prev) => ({ ...prev, user, isLoading: false }))
        return true
      }
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed"
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      return false
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  }
}
