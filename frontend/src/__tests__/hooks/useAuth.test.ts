import { renderHook, act, waitFor } from "@testing-library/react"
import { useAuth } from "@/hooks/useAuth"

jest.mock("@/lib/auth", () => ({
  getStoredUser: jest.fn(() => null),
  getStoredToken: jest.fn(() => null),
  setAuthData: jest.fn(),
  clearAuthData: jest.fn(),
  initializeAuth: jest.fn(),
  isTokenExpired: jest.fn(() => true),
  refreshAccessToken: jest.fn(),
}))

jest.mock("@/lib/api", () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

import { authApi } from "@/lib/api"
import {
  getStoredUser,
  getStoredToken,
  setAuthData,
  clearAuthData,
  isTokenExpired,
} from "@/lib/auth"

const mockAuthApi = jest.mocked(authApi)
const mockGetStoredUser = jest.mocked(getStoredUser)
const mockGetStoredToken = jest.mocked(getStoredToken)
const mockSetAuthData = jest.mocked(setAuthData)
const mockClearAuthData = jest.mocked(clearAuthData)
const mockIsTokenExpired = jest.mocked(isTokenExpired)

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetStoredUser.mockReturnValue(null)
    mockGetStoredToken.mockReturnValue(null)
    mockIsTokenExpired.mockReturnValue(true)
  })

  it("returns initial state with isLoading true", async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("sets authenticated state when valid token exists", async () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "admin" as const,
      permissions: [],
      mfaEnabled: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }

    mockGetStoredUser.mockReturnValue(mockUser as any)
    mockGetStoredToken.mockReturnValue("valid-token")
    mockIsTokenExpired.mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("login calls API and updates state on success", async () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "admin" as const,
    }

    mockAuthApi.login.mockResolvedValue({
      success: true,
      data: {
        accessToken: "new-token",
        refreshToken: "new-refresh",
        expiresIn: 3600,
        user: mockUser as any,
      },
      timestamp: new Date().toISOString(),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let loginResult: boolean | undefined
    await act(async () => {
      loginResult = await result.current.login({
        email: "test@test.com",
        password: "password123",
      })
    })

    expect(loginResult).toBe(true)
    expect(mockAuthApi.login).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password123",
    })
    expect(mockSetAuthData).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it("login sets error state on failure", async () => {
    mockAuthApi.login.mockRejectedValue(new Error("Invalid credentials"))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let loginResult: boolean | undefined
    await act(async () => {
      loginResult = await result.current.login({
        email: "test@test.com",
        password: "wrong",
      })
    })

    expect(loginResult).toBe(false)
    expect(result.current.error).toBe("Invalid credentials")
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("logout clears auth state", async () => {
    const mockUser = {
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "admin" as const,
    }

    mockGetStoredUser.mockReturnValue(mockUser as any)
    mockGetStoredToken.mockReturnValue("valid-token")
    mockIsTokenExpired.mockReturnValue(false)
    mockAuthApi.logout.mockResolvedValue({
      success: true,
      data: undefined as any,
      timestamp: new Date().toISOString(),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockClearAuthData).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("clearError removes the error message", async () => {
    mockAuthApi.login.mockRejectedValue(new Error("Login failed"))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login({
        email: "test@test.com",
        password: "wrong",
      })
    })

    expect(result.current.error).toBe("Login failed")

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
