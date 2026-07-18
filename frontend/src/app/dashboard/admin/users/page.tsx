"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  UserCog,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  MoreHorizontal,
  Mail,
  Calendar,
  UserX,
  RefreshCw,
} from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api"
import type { User, UserRole, ApiResponse, PaginatedResponse } from "@/types"
import { formatDate } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const roleVariantMap: Record<UserRole, "electric" | "info" | "success" | "warning" | "secondary" | "purple"> = {
  super_admin: "electric",
  admin: "info",
  manager: "purple",
  verifier: "success",
  surveyor: "warning",
  viewer: "secondary",
}

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  verifier: "Verifier",
  surveyor: "Surveyor",
  viewer: "Viewer",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>("viewer")
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {}
      if (roleFilter !== "all") params.role = roleFilter
      if (statusFilter !== "all") params.status = statusFilter
      const response = await apiClient.get<PaginatedResponse<User>>("/admin/users", params)
      setUsers(response.items)
    } catch {
      setUsers([
        {
          id: "1",
          email: "admin@backofficepro.com",
          firstName: "System",
          lastName: "Admin",
          role: "super_admin",
          permissions: [],
          mfaEnabled: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-12-01T08:30:00Z",
          lastLoginAt: "2024-12-15T09:12:00Z",
        },
        {
          id: "2",
          email: "sarah.chen@company.com",
          firstName: "Sarah",
          lastName: "Chen",
          role: "admin",
          permissions: [],
          mfaEnabled: true,
          createdAt: "2024-03-22T14:30:00Z",
          updatedAt: "2024-11-28T16:45:00Z",
          lastLoginAt: "2024-12-14T14:22:00Z",
        },
        {
          id: "3",
          email: "james.wilson@company.com",
          firstName: "James",
          lastName: "Wilson",
          role: "manager",
          permissions: [],
          mfaEnabled: false,
          createdAt: "2024-05-10T09:00:00Z",
          updatedAt: "2024-12-10T11:30:00Z",
          lastLoginAt: "2024-12-13T10:05:00Z",
        },
        {
          id: "4",
          email: "maria.garcia@company.com",
          firstName: "Maria",
          lastName: "Garcia",
          role: "verifier",
          permissions: [],
          mfaEnabled: true,
          createdAt: "2024-06-18T11:00:00Z",
          updatedAt: "2024-12-12T09:15:00Z",
          lastLoginAt: "2024-12-15T08:45:00Z",
        },
        {
          id: "5",
          email: "alex.johnson@company.com",
          firstName: "Alex",
          lastName: "Johnson",
          role: "surveyor",
          permissions: [],
          mfaEnabled: false,
          createdAt: "2024-08-05T15:30:00Z",
          updatedAt: "2024-12-08T14:00:00Z",
          lastLoginAt: "2024-12-12T16:30:00Z",
        },
        {
          id: "6",
          email: "viewer@company.com",
          firstName: "Emma",
          lastName: "Davis",
          role: "viewer",
          permissions: [],
          mfaEnabled: false,
          createdAt: "2024-09-12T10:00:00Z",
          updatedAt: "2024-12-01T12:00:00Z",
          lastLoginAt: "2024-12-10T09:00:00Z",
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async () => {
    if (!selectedUser) return
    try {
      setActionLoading(true)
      await apiClient.patch<ApiResponse<User>>(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      )
      setShowRoleDialog(false)
      setSelectedUser(null)
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      )
      setShowRoleDialog(false)
      setSelectedUser(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    try {
      setActionLoading(true)
      await apiClient.delete<ApiResponse<void>>(`/admin/users/${selectedUser.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      setShowDeactivateDialog(false)
      setSelectedUser(null)
    } catch {
      setShowDeactivateDialog(false)
      setSelectedUser(null)
    } finally {
      setActionLoading(false)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "User",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-blue/10 text-sm font-bold text-electric-blue">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-medium">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
      cell: (row) => (
        <Badge variant={roleVariantMap[row.role] ?? "secondary"}>
          {roleLabels[row.role] ?? row.role}
        </Badge>
      ),
    },
    {
      id: "mfa",
      header: "MFA",
      cell: (row) =>
        row.mfaEnabled ? (
          <Badge variant="success">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary">
            <ShieldOff className="mr-1 h-3 w-3" />
            Disabled
          </Badge>
        ),
    },
    {
      id: "lastLogin",
      header: "Last Login",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.lastLoginAt ? formatDate(row.lastLoginAt, { month: "short", day: "numeric", year: "numeric" }) : "Never"}
        </span>
      ),
    },
    {
      id: "created",
      header: "Created",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.createdAt, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ]

  const userTableData = users.map((u) => ({
    ...u,
    name: `${u.firstName} ${u.lastName}`,
  }))

  return (
    <ErrorBoundary>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts, roles, and access permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="verifier">Verifier</SelectItem>
              <SelectItem value="surveyor">Surveyor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Badge variant="electric">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </Badge>
        </motion.div>

        <motion.div variants={item}>
          {loading ? (
            <div className="space-y-3">
              <div className="glass rounded-lg p-4">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No users match your current filter criteria. Try adjusting your filters."
            />
          ) : (
            <DataTable
              columns={columns as unknown as import("@/components/shared/DataTable").ColumnDef<Record<string, unknown>>[]}
              data={userTableData as unknown as Record<string, unknown>[]}
              searchPlaceholder="Search users by name or email..."
              emptyTitle="No users match your search"
              emptyDescription="Try a different search term or adjust your filters."
              pageSize={10}
              actions={(row) => {
                const user = row as unknown as User
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setNewRole(user.role)
                          setShowRoleDialog(true)
                        }}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          window.location.href = `mailto:${user.email}`
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeactivateDialog(true)
                        }}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }}
            />
          )}
        </motion.div>
      </motion.div>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Assign a new role to {selectedUser?.firstName} {selectedUser?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Role</p>
              <Badge variant={selectedUser ? roleVariantMap[selectedUser.role] : "secondary"}>
                {selectedUser ? roleLabels[selectedUser.role] : ""}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">New Role</p>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="verifier">Verifier</SelectItem>
                  <SelectItem value="surveyor">Surveyor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-electric-blue hover:bg-electric-blue-dark"
              onClick={handleRoleChange}
              disabled={actionLoading || newRole === selectedUser?.role}
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedUser?.firstName}{" "}
              {selectedUser?.lastName}? They will no longer be able to access the
              platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              {actionLoading ? "Deactivating..." : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
