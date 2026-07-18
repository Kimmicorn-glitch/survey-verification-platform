"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Image,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Plus,
} from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Report } from "@/types"

const DashboardLayout = dynamic(
  () => import("@/components/dashboard/DashboardLayout"),
  { ssr: false }
)

const quickReports = [
  {
    title: "Survey Summary",
    description: "Overview of all surveys with key metrics and completion rates",
    icon: <BarChart3 className="h-5 w-5 text-electric-blue" />,
    color: "bg-electric-blue/10",
  },
  {
    title: "Verification Report",
    description: "Detailed verification status and trust scores across responses",
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
    color: "bg-green-500/10",
  },
  {
    title: "Fraud Analysis",
    description: "Detection patterns, flagged responses, and fraud indicators",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-500/10",
  },
  {
    title: "NFT Minting Report",
    description: "Blockchain certificates, minting status, and transaction history",
    icon: <Image className="h-5 w-5 text-purple-light" />,
    color: "bg-purple/10",
  },
]

const mockReports: Report[] = [
  {
    id: "r1",
    title: "Survey Summary - Q4 2024",
    type: "Survey Summary",
    surveyId: "1",
    format: "csv",
    status: "ready",
    downloadUrl: "#",
    createdAt: "2024-12-15T10:30:00Z",
    completedAt: "2024-12-15T10:30:05Z",
  },
  {
    id: "r2",
    title: "Fraud Analysis - December",
    type: "Fraud Analysis",
    format: "pdf",
    status: "ready",
    downloadUrl: "#",
    createdAt: "2024-12-14T14:20:00Z",
    completedAt: "2024-12-14T14:20:12Z",
  },
  {
    id: "r3",
    title: "Verification Report - All Surveys",
    type: "Verification Report",
    format: "json",
    status: "ready",
    downloadUrl: "#",
    createdAt: "2024-12-13T09:15:00Z",
    completedAt: "2024-12-13T09:15:08Z",
  },
  {
    id: "r4",
    title: "NFT Minting Report - Batch 42",
    type: "NFT Minting",
    surveyId: "2",
    format: "csv",
    status: "generating",
    createdAt: "2024-12-15T11:00:00Z",
  },
  {
    id: "r5",
    title: "Survey Summary - November",
    type: "Survey Summary",
    format: "pdf",
    status: "failed",
    createdAt: "2024-12-01T08:00:00Z",
  },
]

const statusConfig: Record<
  Report["status"],
  { variant: "success" | "warning" | "destructive"; icon: React.ReactNode; label: string }
> = {
  ready: {
    variant: "success",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Ready",
  },
  generating: {
    variant: "warning",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    label: "Generating",
  },
  failed: {
    variant: "destructive",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Failed",
  },
}

export default function ReportsPage() {
  const [selectedSurvey, setSelectedSurvey] = useState<string>("")
  const [dateRange, setDateRange] = useState<string>("")
  const [exportFormat, setExportFormat] = useState<string>("csv")

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight"
          >
            Reports
          </motion.h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage reports for your surveys
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickReports.map((report, i) => (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="glass transition-all hover:shadow-lg hover:shadow-electric-blue/5 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${report.color}`}>
                      {report.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-electric-blue transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-4 bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue"
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Generate Custom Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Survey
                  </label>
                  <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select survey" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Surveys</SelectItem>
                      <SelectItem value="1">Customer Satisfaction Q4</SelectItem>
                      <SelectItem value="2">Employee Engagement</SelectItem>
                      <SelectItem value="3">Market Research: AI</SelectItem>
                      <SelectItem value="4">Vendor Assessment 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Format
                  </label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    &nbsp;
                  </label>
                  <Button className="w-full bg-electric-blue hover:bg-electric-blue-dark">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Report History</CardTitle>
              <Badge variant="secondary">{mockReports.length} reports</Badge>
            </CardHeader>
            <CardContent>
              {mockReports.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                  title="No reports yet"
                  description="Generate your first report using the tools above."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="uppercase text-xs font-medium text-muted-foreground">
                            {report.format}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[report.status].variant}>
                            <span className="flex items-center gap-1.5">
                              {statusConfig[report.status].icon}
                              {statusConfig[report.status].label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {report.status === "ready" ? (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : report.status === "failed" ? (
                            <Button variant="ghost" size="sm" className="text-electric-blue">
                              Retry
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
    </ErrorBoundary>
  )
}
