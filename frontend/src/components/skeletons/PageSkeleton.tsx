"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface PageSkeletonProps {
  className?: string
}

function StatsRowSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function HeaderSkeleton({ withButton = true }: { withButton?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {withButton && <Skeleton className="h-9 w-32 rounded-lg" />}
    </div>
  )
}

export function DashboardSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <HeaderSkeleton />
      <StatsRowSkeleton />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2 px-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-muted/50 animate-pulse"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SurveyListSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <HeaderSkeleton />

      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <StatsRowSkeleton />

      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <div className="h-full flex items-end gap-1 px-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5">
                  <div
                    className="rounded-t-sm bg-electric-blue/30 animate-pulse"
                    style={{ height: `${25 + Math.random() * 55}%` }}
                  />
                  <div
                    className="rounded-t-sm bg-green-500/30 animate-pulse"
                    style={{ height: `${20 + Math.random() * 45}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-end gap-3 px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-muted/50 animate-pulse"
                  style={{ height: `${20 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-52" />
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="flex gap-4 pb-3 border-b">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1 rounded-md" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-4 items-center py-3 border-b last:border-0">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <StatsRowSkeleton />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
