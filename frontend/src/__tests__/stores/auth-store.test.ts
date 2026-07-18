import { renderHook, act } from "@testing-library/react"
import { useAuthStore } from "@/stores/auth-store"

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  it("initializes with default state", () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })

  it("login sets user and tokens", () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "admin",
      organizationId: "org-1",
    }

    act(() => {
      result.current.login(mockUser, "access-token-123", "refresh-token-456")
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.accessToken).toBe("access-token-123")
    expect(result.current.refreshToken).toBe("refresh-token-456")
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("logout clears all state", () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "admin",
      organizationId: "org-1",
    }

    act(() => {
      result.current.login(mockUser, "access-token", "refresh-token")
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("setUser updates user and isAuthenticated", () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: "2",
      email: "user@test.com",
      firstName: "User",
      lastName: "Two",
      role: "viewer",
      organizationId: "org-2",
    }

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("setTokens updates access and refresh tokens", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setTokens("new-access", "new-refresh")
    })

    expect(result.current.accessToken).toBe("new-access")
    expect(result.current.refreshToken).toBe("new-refresh")
  })

  it("setLoading updates loading state", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)
  })
})
