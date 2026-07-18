"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SkipToContentProps {
  targetId?: string
  className?: string
}

export function SkipToContent({
  targetId = "main-content",
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
        "focus:rounded-lg focus:bg-electric-blue focus:px-4 focus:py-2 focus:text-sm",
        "focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-electric-blue/50",
        "focus:shadow-lg focus:shadow-electric-blue/25",
        className
      )}
    >
      Skip to content
    </a>
  )
}

export default SkipToContent
