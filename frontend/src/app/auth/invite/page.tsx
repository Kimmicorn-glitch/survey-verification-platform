"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { UserPlus, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type InviteStatus = "loading" | "valid" | "expired" | "accepted"

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<InviteStatus>("loading")
  const [inviteInfo, setInviteInfo] = useState<{ email: string; role: string; invitedBy: string } | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("expired")
      return
    }
    const timer = setTimeout(() => {
      setInviteInfo({
        email: "colleague@example.com",
        role: "Survey Analyst",
        invitedBy: "team@company.com",
      })
      setStatus("valid")
    }, 1000)
    return () => clearTimeout(timer)
  }, [token])

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await new Promise((r) => setTimeout(r, 1500))
      setStatus("accepted")
    } catch {
      // handle error
    } finally {
      setIsAccepting(false)
    }
  }

  if (status === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 text-electric-blue animate-spin" />
        </div>
        <p className="text-slate">Verifying your invitation...</p>
      </motion.div>
    )
  }

  if (status === "expired") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Invalid or expired invitation
          </h1>
          <p className="text-slate max-w-sm mx-auto">
            This invitation link is no longer valid. Please ask your team admin to send a new one.
          </p>
        </div>
        <Link href="/auth/register">
          <Button variant="outline" className="h-11 border-soft-grey text-charcoal hover:bg-ghost-white">
            Create a personal account
          </Button>
        </Link>
      </motion.div>
    )
  }

  if (status === "accepted") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Welcome to the team
          </h1>
          <p className="text-slate max-w-sm mx-auto">
            Your account is ready. You&apos;ll be redirected to set up your password.
          </p>
        </div>
        <Link href="/auth/login">
          <Button className="h-11 bg-electric-blue hover:bg-electric-blue-dark text-white font-semibold shadow-sm shadow-electric-blue/20">
            Go to Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-blue/10">
            <UserPlus className="h-6 w-6 text-electric-blue" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal text-center">
          You&apos;re invited
        </h1>
        <p className="text-slate text-center max-w-sm mx-auto">
          Join your team on the Survey Verification Platform
        </p>
      </div>

      {inviteInfo && (
        <div className="rounded-xl bg-ghost-white border border-soft-grey/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Invited to</span>
            <span className="font-medium text-charcoal">{inviteInfo.email}</span>
          </div>
          <div className="border-t border-soft-grey" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Role</span>
            <span className="font-medium text-charcoal">{inviteInfo.role}</span>
          </div>
          <div className="border-t border-soft-grey" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Invited by</span>
            <span className="font-medium text-charcoal">{inviteInfo.invitedBy}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleAccept}
          className="w-full h-11 bg-electric-blue hover:bg-electric-blue-dark text-white font-semibold shadow-sm shadow-electric-blue/20"
          disabled={isAccepting}
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              Accept Invitation
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-grey">
          By accepting, you agree to the platform&apos;s terms of service.
        </p>
      </div>
    </motion.div>
  )
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-electric-blue animate-spin" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}
