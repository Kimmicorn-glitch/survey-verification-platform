"use client"

import React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DataStateProps {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  onRetry?: () => void
  loadingSkeleton?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function DefaultLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function DataState({
  loading = false,
  error = null,
  empty = false,
  emptyTitle = "No data found",
  emptyDescription = "There is nothing to display yet.",
  emptyIcon,
  onRetry,
  loadingSkeleton,
  children,
  className,
}: DataStateProps) {
  if (loading) {
    return (
      <div className={cn("animate-in fade-in duration-300", className)}>
        {loadingSkeleton || <DefaultLoadingSkeleton />}
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {error}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </motion.div>
    )
  }

  if (empty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          {emptyIcon || <Inbox className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {emptyTitle}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {emptyDescription}
        </p>
      </motion.div>
    )
  }

  return <div className={className}>{children}</div>
}

export default DataState
