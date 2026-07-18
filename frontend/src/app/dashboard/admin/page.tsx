"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Users,
  ClipboardList,
  DollarSign,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Settings,
  UserCog,
  Key,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  Server,
} from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { EmptyState } from "@/components/shared/EmptyState"
import { apiClient } from "@/lib/api"
import type { ApiResponse } from "@/types"
import Link from "next/link"

interface AdminStats {
  totalUsers: number
  activeSurveys: number
  totalRevenue: number
  systemHealth: number
  usersTrend: number
  surveysTrend: number
  revenueTrend: number
  healthTrend: number
}

interface ActivityItem {
  id: string
  type: "user_joined" | "survey_created" | "verification" | "fraud_detected" | "system"
  message: string
  timestamp: string
  icon: React.ReactNode
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const quickActions = [
  {
    title: "Manage Users",
    description: "View and manage user accounts, roles, and permissions",
    href: "/dashboard/admin/users",
    icon: <UserCog className="h-5 w-5 text-electric-blue" />,
  },
  {
    title: "Role Management",
    description: "Configure roles and their associated permissions",
    href: "/dashboard/admin/roles",
    icon: <Key className="h-5 w-5 text-purple-light" />,
  },
  {
    title: "System Settings",
    description: "Platform configuration, security, and feature flags",
    href: "/dashboard/admin/settings",
    icon: <Settings className="h-5 w-5 text-green-500" />,
  },
]

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    type: "user_joined",
    message: "New user registered: sarah.chen@company.com",
    timestamp: "3 min ago",
    icon: <Users className="h-4 w-4 text-electric-blue" />,
  },
  {
    id: "2",
    type: "survey_created",
    message: "Survey \"Q4 Customer Feedback\" was published",
    timestamp: "12 min ago",
    icon: <ClipboardList className="h-4 w-4 text-green-500" />,
  },
  {
    id: "3",
    type: "verification",
    message: "Batch verification completed: 248 responses verified",
    timestamp: "28 min ago",
    icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
  },
  {
    id: "4",
    type: "fraud_detected",
    message: "3 suspicious responses flagged in \"Market Survey #891\"",
    timestamp: "1 hour ago",
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  },
  {
    id: "5",
    type: "system",
    message: "Database backup completed successfully",
    timestamp: "2 hours ago",
    icon: <Database className="h-4 w-4 text-muted-foreground" />,
  },
  {
    id: "6",
    type: "user_joined",
    message: "New admin user created: james.wilson@company.com",
    timestamp: "3 hours ago",
    icon: <Users className="h-4 w-4 text-electric-blue" />,
  },
  {
    id: "7",
    type: "system",
    message: "SSL certificate renewed for api.backofficepro.com",
    timestamp: "5 hours ago",
    icon: <Server className="h-4 w-4 text-muted-foreground" />,
  },
]

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<ApiResponse<AdminStats>>("/admin/stats")
      setStats(response.data)
    } catch {
      setStats({
        totalUsers: 1247,
        activeSurveys: 89,
        totalRevenue: 148750,
        systemHealth: 99.8,
        usersTrend: 12.5,
        surveysTrend: 8.3,
        revenueTrend: 23.1,
        healthTrend: 0.2,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const adminStats = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() ?? "0",
      change: stats?.usersTrend,
      icon: <Users className="h-5 w-5 text-electric-blue" />,
    },
    {
      title: "Active Surveys",
      value: stats?.activeSurveys?.toLocaleString() ?? "0",
      change: stats?.surveysTrend,
      icon: <ClipboardList className="h-5 w-5 text-green-500" />,
    },
    {
      title: "Total Revenue",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      change: stats?.revenueTrend,
      icon: <DollarSign className="h-5 w-5 text-purple-light" />,
    },
    {
      title: "System Health",
      value: stats ? `${stats.systemHealth}%` : "0%",
      change: stats?.healthTrend,
      changeLabel: "vs yesterday",
      icon: <Activity className="h-5 w-5 text-green-500" />,
    },
  ]

  return (
    <ErrorBoundary>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform overview and system management.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>

        <motion.div variants={item}>
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {adminStats.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={item}
                >
                  <StatsCard {...stat} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <Badge variant="info">Live</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivity.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="Activity will appear here as events occur across the platform."
                />
              ) : (
                mockActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "API Server", status: "Operational", color: "text-green-500" },
                { label: "Database", status: "Operational", color: "text-green-500" },
                { label: "Blockchain Node", status: "Operational", color: "text-green-500" },
                { label: "AI Verification", status: "Operational", color: "text-green-500" },
                { label: "NFT Service", status: "Degraded", color: "text-yellow-500" },
                { label: "CDN", status: "Operational", color: "text-green-500" },
              ].map((service) => (
                <div
                  key={service.label}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">{service.label}</span>
                  <span className={`text-xs font-medium ${service.color}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, i) => (
              <motion.div key={i} variants={item}>
                <Link href={action.href}>
                  <Card className="transition-all hover:shadow-lg hover:shadow-electric-blue/5 hover:border-electric-blue/30 cursor-pointer h-full">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium flex items-center gap-2">
                          {action.title}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  )
}
