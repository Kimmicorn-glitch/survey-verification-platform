"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Key,
  Check,
  X,
  Save,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/api"
import type { ApiResponse, UserRole, Permission } from "@/types"

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

const ROLES: UserRole[] = ["super_admin", "admin", "manager", "verifier", "surveyor", "viewer"]

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  verifier: "Verifier",
  surveyor: "Surveyor",
  viewer: "Viewer",
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Full system access with all permissions",
  admin: "Administrative access to manage users and settings",
  manager: "Can manage surveys, verifications, and team members",
  verifier: "Can verify responses and approve/reject submissions",
  surveyor: "Can create and manage surveys",
  viewer: "Read-only access to dashboards and reports",
}

const RESOURCES = ["surveys", "responses", "verifications", "nfts", "users", "settings", "reports", "api_keys"]
const ACTIONS: Array<"create" | "read" | "update" | "delete" | "approve" | "export"> = ["create", "read", "update", "delete", "approve", "export"]

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500",
  read: "bg-blue-500",
  update: "bg-yellow-500",
  delete: "bg-red-500",
  approve: "bg-purple-500",
  export: "bg-electric-blue",
}

interface RolePermissions {
  [role: string]: {
    [resource: string]: {
      [action: string]: boolean
    }
  }
}

const defaultPermissions: RolePermissions = {
  super_admin: Object.fromEntries(
    RESOURCES.map((r) => [r, Object.fromEntries(ACTIONS.map((a) => [a, true]))])
  ),
  admin: {
    surveys: { create: true, read: true, update: true, delete: false, approve: true, export: true },
    responses: { create: false, read: true, update: false, delete: false, approve: true, export: true },
    verifications: { create: false, read: true, update: false, delete: false, approve: true, export: true },
    nfts: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    users: { create: true, read: true, update: true, delete: false, approve: false, export: true },
    settings: { create: false, read: true, update: true, delete: false, approve: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    api_keys: { create: true, read: true, update: false, delete: true, approve: false, export: false },
  },
  manager: {
    surveys: { create: true, read: true, update: true, delete: false, approve: true, export: true },
    responses: { create: false, read: true, update: false, delete: false, approve: true, export: true },
    verifications: { create: false, read: true, update: false, delete: false, approve: true, export: false },
    nfts: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    users: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    settings: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    api_keys: { create: false, read: true, update: false, delete: false, approve: false, export: false },
  },
  verifier: {
    surveys: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    responses: { create: false, read: true, update: false, delete: false, approve: true, export: false },
    verifications: { create: true, read: true, update: false, delete: false, approve: true, export: false },
    nfts: { create: true, read: true, update: false, delete: false, approve: false, export: false },
    users: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    api_keys: { create: false, read: false, update: false, delete: false, approve: false, export: false },
  },
  surveyor: {
    surveys: { create: true, read: true, update: true, delete: false, approve: false, export: true },
    responses: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    verifications: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    nfts: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    users: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    api_keys: { create: false, read: false, update: false, delete: false, approve: false, export: false },
  },
  viewer: {
    surveys: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    responses: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    verifications: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    nfts: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    users: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    api_keys: { create: false, read: false, update: false, delete: false, approve: false, export: false },
  },
}

export default function AdminRolesPage() {
  const [permissions, setPermissions] = useState<RolePermissions>(defaultPermissions)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin")
  const [hasChanges, setHasChanges] = useState(false)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<ApiResponse<RolePermissions>>("/admin/roles/permissions")
      setPermissions(response.data)
    } catch {
      setPermissions(defaultPermissions)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const togglePermission = (resource: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [resource]: {
          ...prev[selectedRole]?.[resource],
          [action]: !prev[selectedRole]?.[resource]?.[action],
        },
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.put<ApiResponse<void>>("/admin/roles/permissions", {
        role: selectedRole,
        permissions: permissions[selectedRole],
      })
      setHasChanges(false)
    } catch {
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const rolePermissions = permissions[selectedRole] || {}

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
            <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground mt-1">
              Configure roles and their associated permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning">Unsaved changes</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPermissions}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-electric-blue hover:bg-electric-blue-dark"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Roles</CardTitle>
                  <CardDescription>Select a role to view and edit permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ROLES.map((role) => {
                    const rolePerms = permissions[role] || {}
                    const totalPerms = RESOURCES.reduce(
                      (acc, r) =>
                        acc + ACTIONS.filter((a) => rolePerms[r]?.[a]).length,
                      0
                    )
                    const maxPerms = RESOURCES.length * ACTIONS.length

                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full text-left rounded-lg p-3 transition-all ${
                          selectedRole === role
                            ? "bg-electric-blue/10 border border-electric-blue/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {ROLE_LABELS[role]}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ROLE_DESCRIPTIONS[role]}
                            </p>
                          </div>
                          <Badge variant="electric" className="ml-2 shrink-0">
                            {totalPerms}/{maxPerms}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-electric-blue" />
                    {ROLE_LABELS[selectedRole]} Permissions
                  </CardTitle>
                  <CardDescription>
                    Toggle permissions for each resource and action combination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors bg-muted/30">
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[140px]">
                            Resource
                          </th>
                          {ACTIONS.map((action) => (
                            <th
                              key={action}
                              className="h-10 px-4 text-center align-middle font-medium text-muted-foreground"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`inline-block h-1.5 w-6 rounded-full ${ACTION_COLORS[action]}`}
                                />
                                <span className="capitalize text-xs">{action}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RESOURCES.map((resource, i) => (
                          <tr
                            key={resource}
                            className="border-b transition-colors hover:bg-muted/30"
                          >
                            <td className="p-4 align-middle font-medium capitalize">
                              {resource.replace("_", " ")}
                            </td>
                            {ACTIONS.map((action) => {
                              const isChecked =
                                rolePermissions[resource]?.[action] ?? false
                              return (
                                <td key={action} className="p-4 align-middle text-center">
                                  <div className="flex justify-center">
                                    <Switch
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        togglePermission(resource, action)
                                      }
                                      disabled={selectedRole === "super_admin"}
                                    />
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedRole === "super_admin" && (
                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Super Admin has full system access and permissions cannot be modified.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  )
}
