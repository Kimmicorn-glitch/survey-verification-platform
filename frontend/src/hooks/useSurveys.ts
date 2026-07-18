"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { surveyApi } from "@/lib/api"
import type { Survey, SurveyResponse, PaginatedResponse } from "@/types"

const QUERY_KEYS = {
  surveys: ["surveys"] as const,
  survey: (id: string) => ["surveys", id] as const,
  surveyResponses: (id: string) => ["surveys", id, "responses"] as const,
}

interface UseSurveysParams {
  page?: number
  pageSize?: number
  status?: string
  search?: string
  enabled?: boolean
}

export function useSurveys(params: UseSurveysParams = {}) {
  return useQuery<PaginatedResponse<Survey>>({
    queryKey: [...QUERY_KEYS.surveys, params],
    queryFn: () => surveyApi.list(params),
    enabled: params.enabled !== false,
  })
}

export function useSurvey(id: string) {
  return useQuery<{ success: boolean; data: Survey }>({
    queryKey: QUERY_KEYS.survey(id),
    queryFn: () => surveyApi.get(id),
    enabled: !!id,
  })
}

export function useCreateSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Survey>) => surveyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.surveys })
    },
  })
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Survey> }) =>
      surveyApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.surveys })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.survey(variables.id),
      })
    },
  })
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => surveyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.surveys })
    },
  })
}

export function usePublishSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => surveyApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.surveys })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.survey(id) })
    },
  })
}

export function useCloseSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => surveyApi.close(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.surveys })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.survey(id) })
    },
  })
}

export function useSurveyResponses(
  surveyId: string,
  params?: { page?: number; pageSize?: number }
) {
  return useQuery<PaginatedResponse<SurveyResponse>>({
    queryKey: [...QUERY_KEYS.surveyResponses(surveyId), params],
    queryFn: () => surveyApi.getResponses(surveyId, params),
    enabled: !!surveyId,
  })
}
