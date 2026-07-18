"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useAuthStore } from "@/stores/auth-store"
import { LoadingScreen } from "@/components/shared/LoadingScreen"

const DashboardLayout = dynamic(
  () => import("@/components/dashboard/DashboardLayout"),
  { ssr: false }
)

const ADMIN_ROLES = ["super_admin", "admin"] as const

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/auth/login")
      return
    }

    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      router.replace("/dashboard")
      return
    }

    setAuthorized(true)
  }, [user, isAuthenticated, isLoading, router])

  if (isLoading || !authorized) {
    return <LoadingScreen />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
