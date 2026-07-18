import type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from "@/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.backofficepro.com"

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let error: ApiError
      try {
        const body = await response.json()
        error = {
          code: body.code || "UNKNOWN_ERROR",
          message: body.message || `HTTP ${response.status}`,
          details: body.details,
        }
      } catch {
        error = {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
        }
      }

      if (response.status === 401) {
        this.accessToken = null
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/auth/login"
        }
      }

      throw error
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      return response.json()
    }
    return response.text() as unknown as T
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {}
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    })
    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export const authApi = {
  login: (data: { email: string; password: string; mfaCode?: string }) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number; user: import("@/types").User }>>("/auth/login", data),

  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    organization?: string
  }) =>
    apiClient.post<ApiResponse<{ user: import("@/types").User }>>(
      "/auth/register",
      data
    ),

  logout: () => apiClient.post<ApiResponse<void>>("/auth/logout"),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      "/auth/refresh",
      { refreshToken }
    ),

  getProfile: () =>
    apiClient.get<ApiResponse<import("@/types").User>>("/auth/profile"),

  updateProfile: (data: Partial<import("@/types").User>) =>
    apiClient.put<ApiResponse<import("@/types").User>>("/auth/profile", data),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<void>>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<ApiResponse<void>>("/auth/reset-password", {
      token,
      password,
    }),
}

export const surveyApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<import("@/types").Survey>>("/surveys", params),

  get: (id: string) =>
    apiClient.get<ApiResponse<import("@/types").Survey>>(`/surveys/${id}`),

  create: (data: Partial<import("@/types").Survey>) =>
    apiClient.post<ApiResponse<import("@/types").Survey>>("/surveys", data),

  update: (id: string, data: Partial<import("@/types").Survey>) =>
    apiClient.put<ApiResponse<import("@/types").Survey>>(
      `/surveys/${id}`,
      data
    ),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/surveys/${id}`),

  publish: (id: string) =>
    apiClient.post<ApiResponse<import("@/types").Survey>>(
      `/surveys/${id}/publish`
    ),

  close: (id: string) =>
    apiClient.post<ApiResponse<import("@/types").Survey>>(
      `/surveys/${id}/close`
    ),

  getResponses: (id: string, params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResponse<import("@/types").SurveyResponse>>(
      `/surveys/${id}/responses`,
      params
    ),
}

export const verificationApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<import("@/types").Verification>>(
      "/verifications",
      params
    ),

  get: (id: string) =>
    apiClient.get<ApiResponse<import("@/types").Verification>>(
      `/verifications/${id}`
    ),

  verify: (surveyResponseId: string) =>
    apiClient.post<ApiResponse<import("@/types").Verification>>(
      "/verifications",
      { surveyResponseId }
    ),

  approve: (id: string) =>
    apiClient.post<ApiResponse<import("@/types").Verification>>(
      `/verifications/${id}/approve`
    ),

  reject: (id: string, reason: string) =>
    apiClient.post<ApiResponse<import("@/types").Verification>>(
      `/verifications/${id}/reject`,
      { reason }
    ),
}

export const nftApi = {
  list: (params?: { page?: number; pageSize?: number; owner?: string }) =>
    apiClient.get<PaginatedResponse<import("@/types").NFTCertificate>>(
      "/nfts",
      params
    ),

  get: (id: string) =>
    apiClient.get<ApiResponse<import("@/types").NFTCertificate>>(`/nfts/${id}`),

  mint: (verificationId: string) =>
    apiClient.post<ApiResponse<import("@/types").NFTCertificate>>("/nfts/mint", {
      verificationId,
    }),

  transfer: (id: string, toAddress: string) =>
    apiClient.post<ApiResponse<import("@/types").Transaction>>(
      `/nfts/${id}/transfer`,
      { toAddress }
    ),
}

export const walletApi = {
  getWallets: () =>
    apiClient.get<ApiResponse<import("@/types").Wallet[]>>("/wallets"),

  connect: (address: string, chainId: number) =>
    apiClient.post<ApiResponse<import("@/types").Wallet>>("/wallets/connect", {
      address,
      chainId,
    }),

  disconnect: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/wallets/${id}`),

  getTransactions: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResponse<import("@/types").Transaction>>(
      "/wallets/transactions",
      params
    ),
}

export const dashboardApi = {
  getStats: () =>
    apiClient.get<ApiResponse<import("@/types").DashboardStats>>(
      "/dashboard/stats"
    ),

  getChartData: (range?: string) =>
    apiClient.get<ApiResponse<import("@/types").ChartDataPoint[]>>(
      "/dashboard/charts",
      { range }
    ),
}

export const analyticsApi = {
  getOverview: () =>
    apiClient.get<ApiResponse<Record<string, unknown>>>("/surveys/analytics/overview"),
  getSurveyAnalytics: (surveyId: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/surveys/${surveyId}/analytics`),
  exportCsv: (surveyId: string) =>
    apiClient.get<Blob>(`/surveys/${surveyId}/export/csv`),
  exportJson: (surveyId: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/surveys/${surveyId}/export/json`),
}

export const notificationApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<import("@/types").Notification>>("/notifications", params),
  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>("/notifications/unread-count"),
  markAsRead: (id: string) =>
    apiClient.put<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllAsRead: () =>
    apiClient.put<ApiResponse<void>>("/notifications/read-all"),
  archive: (id: string) =>
    apiClient.put<ApiResponse<void>>(`/notifications/${id}/archive`),
}
