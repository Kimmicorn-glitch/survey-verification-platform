"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  CheckCheck,
  Archive,
  Trash2,
  Inbox,
} from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Notification } from "@/types"

const DashboardLayout = dynamic(
  () => import("@/components/dashboard/DashboardLayout"),
  { ssr: false }
)

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "success",
    title: "Verification Complete",
    message: "Survey \"Customer Satisfaction Q4\" has been fully verified with 94% trust score.",
    read: false,
    createdAt: "2024-12-15T11:30:00Z",
    actionUrl: "/surveys/1",
  },
  {
    id: "n2",
    type: "error",
    title: "Fraud Detected",
    message: "3 flagged responses detected in \"Employee Engagement Survey\". Review recommended.",
    read: false,
    createdAt: "2024-12-15T10:15:00Z",
    actionUrl: "/surveys/2",
  },
  {
    id: "n3",
    type: "warning",
    title: "NFT Minting Delayed",
    message: "Batch minting for verification #4821 is delayed due to network congestion.",
    read: false,
    createdAt: "2024-12-15T09:45:00Z",
  },
  {
    id: "n4",
    type: "info",
    title: "New Survey Published",
    message: "Your survey \"Product Feedback - Beta Launch\" is now live and accepting responses.",
    read: true,
    createdAt: "2024-12-14T16:00:00Z",
    actionUrl: "/surveys/3",
  },
  {
    id: "n5",
    type: "success",
    title: "NFT Certificate Minted",
    message: "Certificate #4821 has been successfully minted on Polygon network.",
    read: true,
    createdAt: "2024-12-14T14:20:00Z",
    actionUrl: "/nfts/4821",
  },
  {
    id: "n6",
    type: "warning",
    title: "Trust Score Drop",
    message: "Average trust score for \"Vendor Assessment 2024\" dropped by 5% in the last 24 hours.",
    read: true,
    createdAt: "2024-12-14T08:30:00Z",
  },
  {
    id: "n7",
    type: "info",
    title: "Weekly Analytics Ready",
    message: "Your weekly analytics digest is ready for review. 12% increase in verified responses.",
    read: true,
    createdAt: "2024-12-13T09:00:00Z",
    actionUrl: "/dashboard/analytics",
  },
  {
    id: "n8",
    type: "error",
    title: "Export Failed",
    message: "Report generation for \"Market Research: AI Adoption\" failed. Please retry.",
    read: true,
    createdAt: "2024-12-12T15:45:00Z",
  },
]

const typeConfig: Record<
  Notification["type"],
  { icon: React.ReactNode; color: string; badgeVariant: "success" | "destructive" | "warning" | "info" }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    color: "bg-green-500/10",
    badgeVariant: "success",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    color: "bg-red-500/10",
    badgeVariant: "destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-500/10",
    badgeVariant: "warning",
  },
  info: {
    icon: <Info className="h-5 w-5 text-electric-blue" />,
    color: "bg-electric-blue/10",
    badgeVariant: "info",
  },
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read
    if (activeTab === "archived") return false
    return true
  })

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleArchive = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-blue/10">
                <Bell className="h-5 w-5 text-electric-blue" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold tracking-tight"
              >
                Notifications
              </motion.h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="px-4">
              All
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="px-4">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="px-4">
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <NotificationList
              notifications={filteredNotifications}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
            />
          </TabsContent>
          <TabsContent value="unread" className="mt-4">
            <NotificationList
              notifications={filteredNotifications}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
            />
          </TabsContent>
          <TabsContent value="archived" className="mt-4">
            <EmptyState
              icon={<Archive className="h-8 w-8 text-muted-foreground" />}
              title="No archived notifications"
              description="Archived notifications will appear here."
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    </ErrorBoundary>
  )
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onArchive,
}: {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
        title="No notifications"
        description="You're all caught up! New notifications will appear here."
      />
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {notifications.map((notification, i) => {
          const config = typeConfig[notification.type]
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`glass rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-electric-blue/5 ${
                !notification.read ? "border-l-2 border-l-electric-blue" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm ${
                          !notification.read
                            ? "font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-electric-blue shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onArchive(notification.id)}
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
