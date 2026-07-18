"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setError("")
    try {
      await new Promise((r) => setTimeout(r, 1500))
      setIsSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
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
            Check your email
          </h1>
          <p className="text-slate max-w-sm mx-auto">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-charcoal">{email}</span>.
            The link expires in 60 minutes.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 border-soft-grey text-charcoal hover:bg-ghost-white"
            onClick={() => {
              setIsSubmitted(false)
              setEmail("")
            }}
          >
            Try a different email
          </Button>
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm font-medium text-electric-blue hover:text-electric-blue-dark transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
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
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-electric-blue hover:text-electric-blue-dark transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">
          Reset your password
        </h1>
        <p className="text-slate">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-charcoal">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              className="pl-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-electric-blue hover:bg-electric-blue-dark text-white font-semibold shadow-sm shadow-electric-blue/20"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-electric-blue hover:text-electric-blue-dark transition-colors"
        >
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
