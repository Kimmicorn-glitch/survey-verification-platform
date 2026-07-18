"use client"

import React, { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-electric-blue/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-electric-blue" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal text-center">
          Verify your email
        </h1>
        <p className="text-slate text-center max-w-sm mx-auto">
          {email ? (
            <>
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-charcoal">{email}</span>.
            </>
          ) : (
            <>We&apos;ve sent a verification link to your email address.</>
          )}
        </p>
      </div>

      <div className="rounded-xl bg-ghost-white border border-soft-grey/60 p-5 space-y-4">
        <h3 className="font-semibold text-charcoal text-sm">What to do next</h3>
        <ol className="space-y-3 text-sm text-slate">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-electric-blue">
              1
            </span>
            <span>Open your email inbox</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-electric-blue">
              2
            </span>
            <span>Find the email from Survey Verification Platform</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-electric-blue">
              3
            </span>
            <span>Click the verification link to activate your account</span>
          </li>
        </ol>
      </div>

      <div className="space-y-3">
        <Link href="/auth/login">
          <Button className="w-full h-11 bg-electric-blue hover:bg-electric-blue-dark text-white font-semibold shadow-sm shadow-electric-blue/20">
            Continue to Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-xs text-muted-grey">
          The verification link expires in 24 hours.
        </p>
      </div>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-electric-blue animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
