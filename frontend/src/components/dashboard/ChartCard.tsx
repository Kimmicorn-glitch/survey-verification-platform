"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-soft-grey/60 rounded-2xl p-6 shadow-elevation-1",
        className
      )}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-charcoal">{title}</h3>
          {description && (
            <p className="text-sm text-slate">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default ChartCard
