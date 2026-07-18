"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon,
  className,
}: StatsCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white border border-soft-grey/60 rounded-2xl p-6 shadow-elevation-1",
        "hover:shadow-elevation-2 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-charcoal">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  isPositive && "bg-green-50 text-green-600",
                  isNegative && "bg-red-50 text-red-600",
                  change === 0 && "bg-ghost-white text-slate"
                )}
              >
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                {Math.abs(change)}%
              </div>
              <span className="text-xs text-slate">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

export default StatsCard
