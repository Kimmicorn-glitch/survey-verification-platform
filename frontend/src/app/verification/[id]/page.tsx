"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, ExternalLink, Copy, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const verificationData = {
  id: "v1",
  surveyTitle: "Customer Satisfaction Q4 2024",
  respondentId: "resp-001",
  status: "verified",
  trustScore: 94,
  confidence: 96,
  verificationHash: "0x7a3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
  blockchainTxHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  nftTokenId: "4821",
  chainId: 137,
  verifiedBy: "AI Auto-Verification",
  verifiedAt: "2024-12-15T10:30:00Z",
  createdAt: "2024-12-15T10:25:00Z",
  aiAnalysis: {
    behaviourScore: 92,
    geoScore: 98,
    patternScore: 89,
    identityScore: 96,
    overallScore: 94,
    recommendations: ["Response timing normal", "Geolocation verified", "No duplicate patterns detected"],
    processingTimeMs: 2340,
    modelVersion: "v2.4.1",
  },
  fraudIndicators: [],
  geoLocation: { latitude: -26.2041, longitude: 28.0473, accuracy: 12, geohash: "kog0j" },
}

export default function VerificationDetailPage() {
  const params = useParams()
  const router = useRouter()

  const scores = [
    { label: "Behaviour", value: verificationData.aiAnalysis.behaviourScore, color: "from-electric-blue to-electric-blue-light" },
    { label: "Geolocation", value: verificationData.aiAnalysis.geoScore, color: "from-green-500 to-green-400" },
    { label: "Pattern", value: verificationData.aiAnalysis.patternScore, color: "from-purple to-purple-light" },
    { label: "Identity", value: verificationData.aiAnalysis.identityScore, color: "from-yellow-500 to-yellow-400" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Verification Detail</h1>
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />Verified
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{verificationData.surveyTitle}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="relative inline-flex">
              <svg className="h-20 w-20" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${verificationData.trustScore}, 100`} className="text-electric-blue" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{verificationData.trustScore}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Trust Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{verificationData.confidence}%</p>
            <p className="text-sm text-muted-foreground mt-1">Confidence</p>
            <p className="text-xs text-muted-foreground mt-2">AI Model: {verificationData.aiAnalysis.modelVersion}</p>
            <p className="text-xs text-muted-foreground">{verificationData.aiAnalysis.processingTimeMs}ms processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">Verification Hash</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{verificationData.verificationHash}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><Copy className="h-3 w-3" /></Button>
            </div>
            <p className="text-sm font-medium mt-2">NFT Token</p>
            <p className="text-xs text-electric-blue">#{verificationData.nftTokenId}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {scores.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium">{s.value}%</span>
                  </div>
                  <Progress value={s.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {verificationData.aiAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Respondent</span><span className="font-mono">{verificationData.respondentId}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Verified By</span><span>{verificationData.verifiedBy}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Verified At</span><span>{new Date(verificationData.verifiedAt).toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Geolocation</span><span className="font-mono">{verificationData.geoLocation.latitude}, {verificationData.geoLocation.longitude}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">GeoHash</span><span className="font-mono">{verificationData.geoLocation.geohash}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs">{verificationData.blockchainTxHash}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Chain</span><span>Polygon ({verificationData.chainId})</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">NFT Token ID</span><span className="text-electric-blue font-bold">#{verificationData.nftTokenId}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
