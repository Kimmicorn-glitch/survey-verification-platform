"use client"

import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left: Branding panel */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center p-12 bg-ghost-white">
        <div className="absolute inset-0 bg-mesh opacity-60" />

        <div className="relative max-w-md text-center space-y-6">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative">
              <Shield className="w-12 h-12 text-electric-blue" />
              <div className="absolute inset-0 w-12 h-12 bg-electric-blue/10 rounded-full blur-xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-charcoal">
              BackOffice
              <span className="text-electric-blue"> Pro</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-charcoal">
            Survey Verification Platform
          </h1>
          <p className="text-lg text-slate">
            Trust Every Survey. Verify Every Transaction.
          </p>

          <div className="flex items-center justify-center gap-8 pt-4">
            <FeatureBadge text="AI-Powered" />
            <div className="h-8 w-px bg-soft-grey" />
            <FeatureBadge text="Blockchain Secured" />
            <div className="h-8 w-px bg-soft-grey" />
            <FeatureBadge text="Enterprise Ready" />
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="relative flex flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <span className="text-sm font-medium text-slate">
      {text}
    </span>
  )
}
