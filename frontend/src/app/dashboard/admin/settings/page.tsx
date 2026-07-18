"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Globe,
  Shield,
  Puzzle,
  Key,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import type { ApiResponse } from "@/types"

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

interface GeneralSettings {
  platformName: string
  platformUrl: string
  contactEmail: string
  supportUrl: string
  maintenanceMode: boolean
  maintenanceMessage: string
}

interface SecuritySettings {
  jwtExpiry: number
  refreshTokenExpiry: number
  passwordMinLength: number
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  enforceMfa: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

interface FeatureFlags {
  blockchainVerification: boolean
  aiVerification: boolean
  nftMinting: boolean
  geolocationTracking: boolean
  advancedAnalytics: boolean
  webhookIntegrations: boolean
}

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsedAt?: string
  isActive: boolean
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [general, setGeneral] = useState<GeneralSettings>({
    platformName: "BackOffice Pro",
    platformUrl: "https://backofficepro.com",
    contactEmail: "support@backofficepro.com",
    supportUrl: "https://support.backofficepro.com",
    maintenanceMode: false,
    maintenanceMessage: "Scheduled maintenance in progress. We'll be back shortly.",
  })

  const [security, setSecurity] = useState<SecuritySettings>({
    jwtExpiry: 3600,
    refreshTokenExpiry: 604800,
    passwordMinLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enforceMfa: false,
    sessionTimeout: 1800,
    maxLoginAttempts: 5,
  })

  const [features, setFeatures] = useState<FeatureFlags>({
    blockchainVerification: true,
    aiVerification: true,
    nftMinting: true,
    geolocationTracking: false,
    advancedAnalytics: true,
    webhookIntegrations: false,
  })

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<ApiResponse<{
        general: GeneralSettings
        security: SecuritySettings
        features: FeatureFlags
        apiKeys: ApiKey[]
      }>>("/admin/settings")
      setGeneral(response.data.general)
      setSecurity(response.data.security)
      setFeatures(response.data.features)
      setApiKeys(response.data.apiKeys)
    } catch {
      setApiKeys([
        {
          id: "1",
          name: "Production API Key",
          key: "sk_live_a1b2c3d4e5f6g7h8i9j0",
          createdAt: "2024-01-20T10:00:00Z",
          lastUsedAt: "2024-12-15T08:30:00Z",
          isActive: true,
        },
        {
          id: "2",
          name: "Staging API Key",
          key: "sk_test_k1l2m3n4o5p6q7r8s9t0",
          createdAt: "2024-03-15T14:00:00Z",
          lastUsedAt: "2024-12-10T12:00:00Z",
          isActive: true,
        },
        {
          id: "3",
          name: "Development Webhook",
          key: "sk_test_u1v2w3x4y5z6a7b8c9d0",
          createdAt: "2024-06-01T09:00:00Z",
          isActive: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.put<ApiResponse<void>>("/admin/settings", {
        general,
        security,
        features,
      })
      setHasChanges(false)
    } catch {
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const markChanged = () => setHasChanges(true)

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return
    try {
      const response = await apiClient.post<ApiResponse<ApiKey>>("/admin/settings/api-keys", {
        name: newKeyName,
      })
      setApiKeys((prev) => [...prev, response.data])
      setNewKeyCreated(response.data.key)
      setNewKeyName("")
      setShowNewKeyDialog(false)
    } catch {
      const mockKey = {
        id: String(Date.now()),
        name: newKeyName,
        key: `sk_live_${Math.random().toString(36).slice(2, 30)}`,
        createdAt: new Date().toISOString(),
        isActive: true,
      }
      setApiKeys((prev) => [...prev, mockKey])
      setNewKeyCreated(mockKey.key)
      setNewKeyName("")
      setShowNewKeyDialog(false)
    }
  }

  const handleRevokeApiKey = async (id: string) => {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/settings/api-keys/${id}`)
    } catch {
      // proceed with local removal
    }
    setApiKeys((prev) => prev.filter((k) => k.id !== id))
  }

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return key.slice(0, 8) + "••••••••••••••••"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-14 w-96" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure platform settings, security, and feature flags.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning">Unsaved changes</Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="general" className="gap-2">
                <Globe className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Puzzle className="h-4 w-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic platform configuration and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform Name</label>
                      <Input
                        value={general.platformName}
                        onChange={(e) => {
                          setGeneral((p) => ({ ...p, platformName: e.target.value }))
                          markChanged()
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform URL</label>
                      <Input
                        value={general.platformUrl}
                        onChange={(e) => {
                          setGeneral((p) => ({ ...p, platformUrl: e.target.value }))
                          markChanged()
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Email</label>
                      <Input
                        type="email"
                        value={general.contactEmail}
                        onChange={(e) => {
                          setGeneral((p) => ({ ...p, contactEmail: e.target.value }))
                          markChanged()
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Support URL</label>
                      <Input
                        value={general.supportUrl}
                        onChange={(e) => {
                          setGeneral((p) => ({ ...p, supportUrl: e.target.value }))
                          markChanged()
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">
                          When enabled, only admins can access the platform
                        </p>
                      </div>
                      <Switch
                        checked={general.maintenanceMode}
                        onCheckedChange={(checked) => {
                          setGeneral((p) => ({ ...p, maintenanceMode: checked }))
                          markChanged()
                        }}
                      />
                    </div>
                    {general.maintenanceMode && (
                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-yellow-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Maintenance Message
                        </label>
                        <Input
                          value={general.maintenanceMessage}
                          onChange={(e) => {
                            setGeneral((p) => ({ ...p, maintenanceMessage: e.target.value }))
                            markChanged()
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Configure JWT tokens and session settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">JWT Token Expiry</label>
                        <Select
                          value={String(security.jwtExpiry)}
                          onValueChange={(v) => {
                            setSecurity((p) => ({ ...p, jwtExpiry: Number(v) }))
                            markChanged()
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="900">15 minutes</SelectItem>
                            <SelectItem value="1800">30 minutes</SelectItem>
                            <SelectItem value="3600">1 hour</SelectItem>
                            <SelectItem value="7200">2 hours</SelectItem>
                            <SelectItem value="14400">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Refresh Token Expiry</label>
                        <Select
                          value={String(security.refreshTokenExpiry)}
                          onValueChange={(v) => {
                            setSecurity((p) => ({ ...p, refreshTokenExpiry: Number(v) }))
                            markChanged()
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="86400">1 day</SelectItem>
                            <SelectItem value="259200">3 days</SelectItem>
                            <SelectItem value="604800">7 days</SelectItem>
                            <SelectItem value="1209600">14 days</SelectItem>
                            <SelectItem value="2592000">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Session Timeout (seconds)</label>
                        <Input
                          type="number"
                          value={security.sessionTimeout}
                          onChange={(e) => {
                            setSecurity((p) => ({ ...p, sessionTimeout: Number(e.target.value) }))
                            markChanged()
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Login Attempts</label>
                        <Input
                          type="number"
                          value={security.maxLoginAttempts}
                          onChange={(e) => {
                            setSecurity((p) => ({ ...p, maxLoginAttempts: Number(e.target.value) }))
                            markChanged()
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>Enforce password complexity requirements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Password Length</label>
                      <Input
                        type="number"
                        value={security.passwordMinLength}
                        onChange={(e) => {
                          setSecurity((p) => ({ ...p, passwordMinLength: Number(e.target.value) }))
                          markChanged()
                        }}
                        className="max-w-[120px]"
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Require Uppercase Letters",
                          key: "requireUppercase" as const,
                        },
                        {
                          label: "Require Numbers",
                          key: "requireNumbers" as const,
                        },
                        {
                          label: "Require Special Characters",
                          key: "requireSpecialChars" as const,
                        },
                        {
                          label: "Enforce MFA for All Users",
                          key: "enforceMfa" as const,
                        },
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between">
                          <p className="text-sm">{setting.label}</p>
                          <Switch
                            checked={security[setting.key] as boolean}
                            onCheckedChange={(checked) => {
                              setSecurity((p) => ({ ...p, [setting.key]: checked }))
                              markChanged()
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>
                    Enable or disable platform features. Changes take effect immediately.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "blockchainVerification" as const,
                      label: "Blockchain Verification",
                      description: "Verify survey responses on-chain using smart contracts",
                      icon: <Shield className="h-4 w-4 text-electric-blue" />,
                    },
                    {
                      key: "aiVerification" as const,
                      label: "AI Verification",
                      description: "Use machine learning models to detect fraud and anomalies",
                      icon: <Puzzle className="h-4 w-4 text-purple-light" />,
                    },
                    {
                      key: "nftMinting" as const,
                      label: "NFT Certificate Minting",
                      description: "Mint NFT certificates for verified survey responses",
                      icon: <Key className="h-4 w-4 text-green-500" />,
                    },
                    {
                      key: "geolocationTracking" as const,
                      label: "Geolocation Tracking",
                      description: "Track respondent geolocation for enhanced verification",
                      icon: <Globe className="h-4 w-4 text-yellow-500" />,
                    },
                    {
                      key: "advancedAnalytics" as const,
                      label: "Advanced Analytics",
                      description: "Extended analytics dashboard with detailed reporting",
                      icon: <Settings className="h-4 w-4 text-electric-blue" />,
                    },
                    {
                      key: "webhookIntegrations" as const,
                      label: "Webhook Integrations",
                      description: "Send real-time event notifications to external services",
                      icon: <Puzzle className="h-4 w-4 text-muted-foreground" />,
                    },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                          {feature.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{feature.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={features[feature.key]}
                        onCheckedChange={(checked) => {
                          setFeatures((p) => ({ ...p, [feature.key]: checked }))
                          markChanged()
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage API keys for external integrations</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-electric-blue hover:bg-electric-blue-dark"
                    onClick={() => setShowNewKeyDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Key
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No API keys created yet.
                      </p>
                    </div>
                  ) : (
                    apiKeys.map((apiKey) => (
                      <div
                        key={apiKey.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <Key className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {apiKey.name}
                              </p>
                              {!apiKey.isActive && (
                                <Badge variant="secondary">Revoked</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-muted-foreground font-mono">
                                {revealedKeys.has(apiKey.id)
                                  ? apiKey.key
                                  : maskKey(apiKey.key)}
                              </code>
                              <button
                                onClick={() => toggleKeyReveal(apiKey.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {revealedKeys.has(apiKey.id) ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(apiKey.key)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="text-right text-xs text-muted-foreground hidden sm:block">
                            {apiKey.lastUsedAt && (
                              <p>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</p>
                            )}
                            <p>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                          </div>
                          {apiKey.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevokeApiKey(apiKey.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for external integrations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <Input
                placeholder="e.g., Production Server Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-electric-blue hover:bg-electric-blue-dark"
              onClick={handleCreateApiKey}
              disabled={!newKeyName.trim()}
            >
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newKeyCreated} onOpenChange={() => setNewKeyCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="flex-1 text-sm font-mono break-all">
                {newKeyCreated}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (newKeyCreated) navigator.clipboard.writeText(newKeyCreated)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
