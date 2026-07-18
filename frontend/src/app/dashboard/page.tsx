"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  ClipboardList,
  ShieldCheck,
  Image,
  AlertTriangle,
  ArrowRight,
  Zap,
  Plus,
} from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

const stats = [
  {
    title: "Total Surveys",
    value: "—",
    change: 0,
    icon: <ClipboardList className="h-5 w-5 text-electric-blue" />,
  },
  {
    title: "Verified Responses",
    value: "—",
    change: 0,
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
  },
  {
    title: "NFTs Minted",
    value: "—",
    change: 0,
    icon: <Image className="h-5 w-5 text-electric-blue" />,
  },
  {
    title: "Fraud Detected",
    value: "—",
    change: 0,
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Dashboard
          </h1>
          <p className="text-slate mt-1">
            Welcome back. Here&apos;s your platform overview.
          </p>
        </div>
        <Button asChild className="bg-electric-blue hover:bg-electric-blue-dark text-white shadow-sm shadow-electric-blue/20">
          <Link href="/surveys/create">
            <Plus className="mr-2 h-4 w-4" />
            New Survey
          </Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </motion.div>

      {/* Empty states */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-charcoal">
              Recent Surveys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-electric-blue/50" />
              </div>
              <p className="text-sm font-medium text-charcoal mb-1">No surveys yet</p>
              <p className="text-xs text-muted-grey mb-4">
                Create your first survey to get started.
              </p>
              <Button asChild size="sm" variant="outline" className="border-soft-grey">
                <Link href="/surveys/create">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Create Survey
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-charcoal">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-electric-blue/50" />
              </div>
              <p className="text-sm font-medium text-charcoal mb-1">No activity yet</p>
              <p className="text-xs text-muted-grey mb-4">
                Activity will appear here as you use the platform.
              </p>
              <Button asChild size="sm" variant="outline" className="border-soft-grey">
                <Link href="/surveys">
                  View Surveys
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
