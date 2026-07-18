"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { verificationApi } from "@/lib/api"
import type { Verification, PaginatedResponse } from "@/types"

const QUERY_KEYS = {
  verifications: ["verifications"] as const,
  verification: (id: string) => ["verifications", id] as const,
}

interface UseVerificationsParams {
  page?: number
  pageSize?: number
  status?: string
  enabled?: boolean
}

export function useVerifications(params: UseVerificationsParams = {}) {
  return useQuery<PaginatedResponse<Verification>>({
    queryKey: [...QUERY_KEYS.verifications, params],
    queryFn: () => verificationApi.list(params),
    enabled: params.enabled !== false,
  })
}

export function useVerification(id: string) {
  return useQuery<{ success: boolean; data: Verification }>({
    queryKey: QUERY_KEYS.verification(id),
    queryFn: () => verificationApi.get(id),
    enabled: !!id,
  })
}

export function useVerifyResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (surveyResponseId: string) =>
      verificationApi.verify(surveyResponseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verifications })
    },
  })
}

export function useApproveVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => verificationApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verifications })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verification(id) })
    },
  })
}

export function useRejectVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      verificationApi.reject(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verifications })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.verification(variables.id),
      })
    },
  })
}
