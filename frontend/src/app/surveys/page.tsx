"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Survey } from "@/types"

const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Customer Satisfaction Q4 2024",
    description: "Quarterly customer satisfaction survey for all product lines",
    status: "active",
    createdBy: "user-1",
    organizationId: "org-1",
    questions: [],
    settings: {
      allowAnonymous: false,
      requireAuthentication: true,
      enableGeolocation: true,
      enableBlockchainVerification: true,
      notificationEmails: ["admin@backofficepro.com"],
    },
    responseCount: 1243,
    completionRate: 87,
    verificationStatus: "verified",
    createdAt: "2024-10-01T00:00:00Z",
    updatedAt: "2024-12-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Employee Engagement Survey",
    description: "Annual employee engagement and satisfaction survey",
    status: "active",
    createdBy: "user-2",
    organizationId: "org-1",
    questions: [],
    settings: {
      allowAnonymous: true,
      requireAuthentication: false,
      enableGeolocation: false,
      enableBlockchainVerification: true,
      notificationEmails: ["hr@backofficepro.com"],
    },
    responseCount: 892,
    completionRate: 94,
    verificationStatus: "verified",
    createdAt: "2024-09-15T00:00:00Z",
    updatedAt: "2024-12-10T00:00:00Z",
  },
  {
    id: "3",
    title: "Product Feedback - Beta Launch",
    description: "Collect feedback on the new beta features",
    status: "draft",
    createdBy: "user-1",
    organizationId: "org-1",
    questions: [],
    settings: {
      allowAnonymous: false,
      requireAuthentication: true,
      enableGeolocation: false,
      enableBlockchainVerification: false,
      notificationEmails: [],
    },
    responseCount: 0,
    completionRate: 0,
    verificationStatus: "pending",
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "4",
    title: "Market Research: AI Adoption",
    description: "Research survey on enterprise AI adoption trends",
    status: "closed",
    createdBy: "user-3",
    organizationId: "org-1",
    questions: [],
    settings: {
      allowAnonymous: true,
      requireAuthentication: false,
      enableGeolocation: true,
      enableBlockchainVerification: true,
      notificationEmails: [],
    },
    responseCount: 3421,
    completionRate: 78,
    verificationStatus: "verified",
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-08-30T00:00:00Z",
  },
  {
    id: "5",
    title: "Vendor Assessment 2024",
    description: "Annual vendor performance and compliance assessment",
    status: "active",
    createdBy: "user-2",
    organizationId: "org-1",
    questions: [],
    settings: {
      allowAnonymous: false,
      requireAuthentication: true,
      enableGeolocation: true,
      enableBlockchainVerification: true,
      notificationEmails: ["procurement@backofficepro.com"],
    },
    responseCount: 567,
    completionRate: 65,
    verificationStatus: "verifying",
    createdAt: "2024-11-01T00:00:00Z",
    updatedAt: "2024-12-14T00:00:00Z",
  },
]

const statusConfig: Record<string, { variant: "success" | "info" | "secondary" | "warning"; label: string }> = {
  active: { variant: "success", label: "Active" },
  draft: { variant: "secondary", label: "Draft" },
  closed: { variant: "info", label: "Closed" },
  paused: { variant: "warning", label: "Paused" },
  archived: { variant: "secondary", label: "Archived" },
}

export default function SurveysPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredSurveys = mockSurveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(search.toLowerCase()) ||
      survey.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || survey.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight"
          >
            Surveys
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your surveys
          </p>
        </div>
        <Button
          asChild
          className="bg-electric-blue hover:bg-electric-blue-dark"
        >
          <a href="/surveys/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Survey
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surveys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
          title="No surveys found"
          description="No surveys match your search criteria. Try adjusting your filters."
        />
      ) : (
        <div className="grid gap-4">
          {filteredSurveys.map((survey, i) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="transition-all hover:shadow-lg hover:shadow-electric-blue/5 cursor-pointer"
                onClick={() => router.push(`/surveys/${survey.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold truncate">
                          {survey.title}
                        </h3>
                        <Badge variant={statusConfig[survey.status]?.variant}>
                          {statusConfig[survey.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {survey.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{survey.responseCount.toLocaleString()} responses</span>
                        <span>{survey.completionRate}% completion</span>
                        <span>
                          Updated{" "}
                          {new Date(survey.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-blue/10">
                        <span className="text-lg font-bold text-electric-blue">
                          {survey.completionRate}
                          <span className="text-xs">%</span>
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/surveys/${survey.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
