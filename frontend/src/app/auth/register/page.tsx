"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    organization: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      organization: "",
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password", "")

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      organization: data.organization,
    })
    if (success) {
      router.push("/auth/login")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">
          Create your account
        </h1>
        <p className="text-slate">
          Get started with the Survey Verification Platform
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-charcoal">
              First name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
              <Input
                id="firstName"
                placeholder="John"
                className="pl-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
                {...register("firstName")}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-charcoal">
              Last name
            </label>
            <Input
              id="lastName"
              placeholder="Doe"
              className="h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-charcoal">
            Work email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="pl-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              {...register("email")}
              onChange={() => clearError()}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="organization" className="block text-sm font-medium text-charcoal">
            Organisation{" "}
            <span className="text-muted-grey font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
            <Input
              id="organization"
              placeholder="Acme Corp"
              className="pl-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              {...register("organization")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-charcoal">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-10 pr-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-grey hover:text-charcoal transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
          {/* Password requirements */}
          {password && (
            <div className="flex flex-wrap gap-2 mt-1">
              {passwordRequirements.map((req) => (
                <span
                  key={req.label}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                    req.test(password) ? "text-green-600" : "text-muted-grey"
                  }`}
                >
                  <Check className={`w-3 h-3 ${req.test(password) ? "text-green-600" : "text-muted-grey/50"}`} />
                  {req.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="pl-10 h-11 bg-ghost-white border-soft-grey focus:ring-electric-blue/20 focus:border-electric-blue/40"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-electric-blue hover:bg-electric-blue-dark text-white font-semibold shadow-sm shadow-electric-blue/20"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-slate">
        By creating an account, you agree to our{" "}
        <Link href="/legal/terms" className="font-medium text-electric-blue hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="font-medium text-electric-blue hover:underline">
          Privacy Policy
        </Link>
      </p>

      <p className="text-center text-sm text-slate">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-electric-blue hover:text-electric-blue-dark transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
