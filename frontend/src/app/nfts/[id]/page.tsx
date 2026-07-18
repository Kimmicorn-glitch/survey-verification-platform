"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Copy, Share2, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const nftData = {
  id: "nft-1",
  tokenId: "4821",
  surveyTitle: "Customer Satisfaction Q4 2024",
  trustScore: 94,
  ownerAddress: "0x4a3d8f2e1b6c9a5d7e3f2b1c8a4d6e9f3a7b2c5d",
  contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
  chainId: 137,
  chainName: "Polygon",
  mintedAt: "2024-12-15T10:35:00Z",
  verificationHash: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd",
  metadata: {
    name: "SVP Certificate #4821",
    description: "Verified survey response certificate for Customer Satisfaction Q4 2024",
    attributes: [
      { trait_type: "Survey", value: "Customer Satisfaction Q4 2024" },
      { trait_type: "Trust Score", value: 94 },
      { trait_type: "Verified By", value: "AI Auto-Verification" },
      { trait_type: "Geo Verified", value: "Yes" },
      { trait_type: "Chain", value: "Polygon" },
    ],
  },
}

export default function NFTDetailPage() {
  const params = useParams()
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{nftData.metadata.name}</h1>
          <p className="text-muted-foreground mt-1">{nftData.surveyTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />Share</Button>
          <Button variant="outline" size="sm"><ExternalLink className="mr-2 h-4 w-4" />View on Explorer</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-electric-blue/20 via-purple/10 to-electric-blue/5 flex items-center justify-center border">
            <div className="text-center space-y-4 p-8">
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-electric-blue/10">
                <Image className="h-12 w-12 text-electric-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{nftData.metadata.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{nftData.metadata.description}</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="electric">Trust Score: {nftData.trustScore}%</Badge>
                <Badge variant="purple">{nftData.chainName}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Token ID</span>
                <span className="font-mono font-bold">#{nftData.tokenId}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chain</span>
                <Badge variant="purple">{nftData.chainName}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Minted</span>
                <span>{new Date(nftData.mintedAt).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground">Owner</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{nftData.ownerAddress}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground">Contract</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{nftData.contractAddress}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><ExternalLink className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Attributes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nftData.metadata.attributes.map((attr, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{attr.trait_type}</span>
                  <span className="font-medium">{String(attr.value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
