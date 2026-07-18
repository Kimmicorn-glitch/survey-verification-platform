"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import {
  ClipboardList,
  Users,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ChartCard } from "@/components/dashboard/ChartCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DashboardLayout = dynamic(
  () => import("@/components/dashboard/DashboardLayout"),
  { ssr: false }
)

const TIME_PERIODS = ["7d", "30d", "90d"] as const

const statsData = [
  {
    title: "Total Surveys",
    value: "2,847",
    change: 12.5,
    changeLabel: "vs last period",
    icon: <ClipboardList className="h-5 w-5 text-electric-blue" />,
  },
  {
    title: "Total Responses",
    value: "124,593",
    change: 8.2,
    changeLabel: "vs last period",
    icon: <Users className="h-5 w-5 text-green-500" />,
  },
  {
    title: "Avg Trust Score",
    value: "87.4",
    change: 3.1,
    changeLabel: "vs last period",
    icon: <ShieldCheck className="h-5 w-5 text-purple-light" />,
  },
  {
    title: "Fraud Detection Rate",
    value: "2.3%",
    change: -1.4,
    changeLabel: "vs last period",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  },
]

const responseTrendsData = [
  { date: "Jun 18", responses: 420, verified: 380, flagged: 12 },
  { date: "Jun 19", responses: 380, verified: 345, flagged: 8 },
  { date: "Jun 20", responses: 510, verified: 472, flagged: 15 },
  { date: "Jun 21", responses: 470, verified: 430, flagged: 10 },
  { date: "Jun 22", responses: 590, verified: 548, flagged: 18 },
  { date: "Jun 23", responses: 620, verified: 580, flagged: 14 },
  { date: "Jun 24", responses: 540, verified: 502, flagged: 11 },
  { date: "Jun 25", responses: 480, verified: 440, flagged: 9 },
  { date: "Jun 26", responses: 650, verified: 610, flagged: 16 },
  { date: "Jun 27", responses: 710, verified: 668, flagged: 19 },
  { date: "Jun 28", responses: 680, verified: 640, flagged: 13 },
  { date: "Jun 29", responses: 590, verified: 552, flagged: 11 },
  { date: "Jun 30", responses: 730, verified: 690, flagged: 17 },
  { date: "Jul 01", responses: 780, verified: 738, flagged: 20 },
  { date: "Jul 02", responses: 820, verified: 780, flagged: 22 },
  { date: "Jul 03", responses: 690, verified: 652, flagged: 15 },
  { date: "Jul 04", responses: 610, verified: 578, flagged: 12 },
  { date: "Jul 05", responses: 750, verified: 710, flagged: 18 },
  { date: "Jul 06", responses: 830, verified: 792, flagged: 21 },
  { date: "Jul 07", responses: 870, verified: 830, flagged: 24 },
  { date: "Jul 08", responses: 910, verified: 868, flagged: 26 },
  { date: "Jul 09", responses: 850, verified: 812, flagged: 20 },
  { date: "Jul 10", responses: 920, verified: 878, flagged: 28 },
  { date: "Jul 11", responses: 960, verified: 918, flagged: 25 },
  { date: "Jul 12", responses: 880, verified: 840, flagged: 22 },
  { date: "Jul 13", responses: 940, verified: 900, flagged: 27 },
  { date: "Jul 14", responses: 990, verified: 948, flagged: 29 },
  { date: "Jul 15", responses: 1020, verified: 978, flagged: 31 },
  { date: "Jul 16", responses: 1050, verified: 1008, flagged: 28 },
  { date: "Jul 17", responses: 1080, verified: 1040, flagged: 30 },
]

const surveyPerformanceData = [
  { name: "Customer Satisfaction Q4", responses: 1243, trustScore: 94, completion: 87 },
  { name: "Market Research: AI", responses: 3421, trustScore: 91, completion: 78 },
  { name: "Employee Engagement", responses: 892, trustScore: 87, completion: 94 },
  { name: "Vendor Assessment 2024", responses: 567, trustScore: 82, completion: 65 },
  { name: "Product Feedback Beta", responses: 234, trustScore: 79, completion: 52 },
  { name: "Brand Perception Study", responses: 1876, trustScore: 88, completion: 81 },
  { name: "UX Research Sprint", responses: 445, trustScore: 90, completion: 72 },
  { name: "Annual Health Check", responses: 2103, trustScore: 85, completion: 69 },
]

const trustScoreDistribution = [
  { range: "0-20", count: 120, fill: "#EF4444" },
  { range: "21-40", count: 340, fill: "#F97316" },
  { range: "41-60", count: 1200, fill: "#EAB308" },
  { range: "61-80", count: 4800, fill: "#22C55E" },
  { range: "81-100", count: 8900, fill: "#0066FF" },
]

const verificationStatusData = [
  { name: "Verified", value: 98400, fill: "#0066FF" },
  { name: "Pending", value: 12300, fill: "#EAB308" },
  { name: "Rejected", value: 8200, fill: "#EF4444" },
  { name: "Disputed", value: 5693, fill: "#A855F7" },
]

const statusColorMap: Record<string, "success" | "warning" | "info" | "destructive"> = {
  Verified: "success",
  Pending: "warning",
  Rejected: "destructive",
  Disputed: "info",
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("30d")

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight"
            >
              Analytics
            </motion.h1>
            <p className="text-muted-foreground mt-1">
              Insights and metrics across all your surveys
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                {TIME_PERIODS.map((p) => (
                  <TabsTrigger key={p} value={p} className="px-4">
                    {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>

        <ChartCard
          title="Response Trends"
          description="Daily responses, verifications, and flagged items"
          action={
            <Button variant="ghost" size="sm">
              <Calendar className="mr-2 h-3 w-3" />
              Last {period === "7d" ? "7" : period === "30d" ? "30" : "90"} days
            </Button>
          }
          className="col-span-full"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseTrendsData}>
                <defs>
                  <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(215 20% 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215 20% 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 8%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 98%)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="responses"
                  stroke="#0066FF"
                  strokeWidth={2}
                  fill="url(#colorResponses)"
                />
                <Area
                  type="monotone"
                  dataKey="verified"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#colorVerified)"
                />
                <Area
                  type="monotone"
                  dataKey="flagged"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#colorFlagged)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Trust Score Distribution">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trustScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="range"
                    stroke="hsl(215 20% 65%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215 20% 65%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 8%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {trustScoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Verification Status Breakdown">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {verificationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 8%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {verificationStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <Badge variant={statusColorMap[item.name]}>
                    {item.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Survey Performance"
          description="Top surveys ranked by response count"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead className="text-right">Trust Score</TableHead>
                <TableHead className="text-right">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveyPerformanceData.map((survey, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{survey.name}</TableCell>
                  <TableCell className="text-right">
                    {survey.responses.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        survey.trustScore >= 90
                          ? "text-green-500 font-medium"
                          : survey.trustScore >= 75
                            ? "text-electric-blue font-medium"
                            : "text-yellow-500 font-medium"
                      }
                    >
                      {survey.trustScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-electric-blue"
                          style={{ width: `${survey.completion}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {survey.completion}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      </div>
    </DashboardLayout>
    </ErrorBoundary>
  )
}
