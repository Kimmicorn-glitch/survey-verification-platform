"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface SkeletonTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = "w-2/3",
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 rounded-md",
            i === lines - 1 ? lastLineWidth : "w-full"
          )}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
  showHeader?: boolean
  headerWidth?: string
}

export function SkeletonCard({
  className,
  showHeader = true,
  headerWidth = "w-1/3",
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className={cn("h-5 rounded-md", headerWidth)} />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`c-${rowIdx}-${colIdx}`}
              className={cn(
                "h-4 flex-1 rounded-md",
                colIdx === 0 ? "w-2/5 flex-none" : ""
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonChartProps {
  className?: string
  height?: string
}

export function SkeletonChart({
  className,
  height = "h-64",
}: SkeletonChartProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const heights = [40, 65, 55, 80, 45, 70, 90, 50, 75, 60, 85, 72]
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-sm bg-muted/50 animate-pulse",
                height
              )}
              style={{ height: `${heights[i]}%`, maxWidth: "100%" }}
            />
          )
        })}
      </div>
      <div className="flex justify-between px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-12 rounded-md" />
        ))}
      </div>
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
}

export function SkeletonAvatar({
  size = "md",
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn(
        "rounded-full shrink-0",
        avatarSizes[size],
        className
      )}
    />
  )
}
