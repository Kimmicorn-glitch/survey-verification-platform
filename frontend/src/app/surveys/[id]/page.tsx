"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Share2, Download, Users, ShieldCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

const surveyData = {
  id: "1",
  title: "Customer Satisfaction Q4 2024",
  description: "Quarterly customer satisfaction survey for all product lines.",
  status: "active",
  responseCount: 1243,
  completionRate: 87,
  verificationStatus: "verified",
  trustScore: 94,
  createdAt: "2024-10-01",
  updatedAt: "2024-12-15",
  questions: [
    { id: "q1", text: "How satisfied are you with our product?", type: "rating", responses: 1243, avg: "4.6/5" },
    { id: "q2", text: "How likely are you to recommend us?", type: "scale", responses: 1243, avg: "8.2/10" },
    { id: "q3", text: "What could we improve?", type: "textarea", responses: 987, avg: "N/A" },
    { id: "q4", text: "Which features do you use most?", type: "multi_select", responses: 1200, avg: "Dashboard" },
    { id: "q5", text: "How was your support experience?", type: "rating", responses: 892, avg: "4.8/5" },
  ],
}

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{surveyData.title}</h1>
            <Badge variant="success">{surveyData.status}</Badge>
            <Badge variant="info">{surveyData.verificationStatus}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{surveyData.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />Share</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button size="sm" className="bg-electric-blue hover:bg-electric-blue-dark"><Edit className="mr-2 h-4 w-4" />Edit</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-electric-blue" />
            <p className="text-2xl font-bold">{surveyData.responseCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{surveyData.trustScore}%</p>
            <p className="text-xs text-muted-foreground">Trust Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-purple-light" />
            <p className="text-2xl font-bold">{surveyData.completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{surveyData.questions.length}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4 mt-4">
          {surveyData.questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-blue/10 text-sm font-bold text-electric-blue">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{q.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Type: {q.type} &middot; {q.responses} responses &middot; Avg: {q.avg}</p>
                </div>
                <Progress value={(q.responses / surveyData.responseCount) * 100} className="w-32" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Response data will appear here with full survey answers.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Charts and analytics will appear here.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Blockchain verification details will appear here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
