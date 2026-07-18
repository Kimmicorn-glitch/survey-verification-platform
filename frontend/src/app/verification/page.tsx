"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShieldCheck, Search, Filter, AlertTriangle, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mockVerifications = [
  {
    id: "v1",
    surveyTitle: "Customer Satisfaction Q4 2024",
    respondentId: "resp-001",
    status: "verified",
    trustScore: 94,
    confidence: 96,
    fraudIndicators: 0,
    verifiedAt: "2024-12-15T10:30:00Z",
    createdAt: "2024-12-15T10:25:00Z",
  },
  {
    id: "v2",
    surveyTitle: "Employee Engagement Survey",
    respondentId: "resp-042",
    status: "verified",
    trustScore: 87,
    confidence: 91,
    fraudIndicators: 0,
    verifiedAt: "2024-12-14T14:20:00Z",
    createdAt: "2024-12-14T14:15:00Z",
  },
  {
    id: "v3",
    surveyTitle: "Customer Satisfaction Q4 2024",
    respondentId: "resp-156",
    status: "rejected",
    trustScore: 23,
    confidence: 89,
    fraudIndicators: 3,
    verifiedAt: "2024-12-14T09:10:00Z",
    createdAt: "2024-12-14T09:05:00Z",
  },
  {
    id: "v4",
    surveyTitle: "Vendor Assessment 2024",
    respondentId: "resp-089",
    status: "verifying",
    trustScore: 0,
    confidence: 0,
    fraudIndicators: 0,
    verifiedAt: undefined,
    createdAt: "2024-12-15T12:00:00Z",
  },
  {
    id: "v5",
    surveyTitle: "Market Research: AI Adoption",
    respondentId: "resp-312",
    status: "pending",
    trustScore: 0,
    confidence: 0,
    fraudIndicators: 0,
    verifiedAt: undefined,
    createdAt: "2024-12-15T13:00:00Z",
  },
  {
    id: "v6",
    surveyTitle: "Employee Engagement Survey",
    respondentId: "resp-078",
    status: "disputed",
    trustScore: 52,
    confidence: 61,
    fraudIndicators: 1,
    verifiedAt: "2024-12-13T16:45:00Z",
    createdAt: "2024-12-13T16:40:00Z",
  },
]

const statusConfig: Record<string, { variant: "success" | "destructive" | "secondary" | "info" | "warning"; icon: React.ReactNode }> = {
  verified: { variant: "success", icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { variant: "destructive", icon: <XCircle className="h-4 w-4" /> },
  verifying: { variant: "info", icon: <Clock className="h-4 w-4" /> },
  pending: { variant: "secondary", icon: <Clock className="h-4 w-4" /> },
  disputed: { variant: "warning", icon: <AlertTriangle className="h-4 w-4" /> },
}

export default function VerificationPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = mockVerifications.filter((v) => {
    const matchSearch = v.surveyTitle.toLowerCase().includes(search.toLowerCase()) || v.respondentId.includes(search)
    const matchStatus = statusFilter === "all" || v.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tight">
            Verification Dashboard
          </motion.h1>
          <p className="text-muted-foreground mt-1">AI-powered fraud detection and blockchain verification</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Verified", value: "18,392", color: "text-green-500" },
          { label: "Pending", value: "127", color: "text-yellow-500" },
          { label: "Rejected", value: "147", color: "text-red-500" },
          { label: "Disputed", value: "23", color: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by survey or respondent..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verifying">Verifying</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:shadow-electric-blue/5" onClick={() => router.push(`/verification/${v.id}`)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-blue/10">
                  <ShieldCheck className="h-5 w-5 text-electric-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{v.surveyTitle}</p>
                    <Badge variant={statusConfig[v.status]?.variant as "success" | "destructive" | "info" | "secondary" | "warning"}>
                      <span className="flex items-center gap-1">
                        {statusConfig[v.status]?.icon}
                        {v.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Respondent: {v.respondentId}</p>
                </div>
                <div className="text-right space-y-1">
                  {v.trustScore > 0 && (
                    <div className="flex items-center gap-2">
                      <Progress value={v.trustScore} className="w-20 h-1.5" />
                      <span className="text-sm font-bold">{v.trustScore}%</span>
                    </div>
                  )}
                  {v.fraudIndicators > 0 && (
                    <p className="text-xs text-red-500">{v.fraudIndicators} fraud indicator(s)</p>
                  )}
                </div>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
