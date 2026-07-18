"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Image, Search, ExternalLink, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"

const mockNFTs = Array.from({ length: 12 }, (_, i) => ({
  id: `nft-${i + 1}`,
  tokenId: String(4800 + i),
  surveyTitle: ["Customer Satisfaction Q4", "Employee Engagement", "Market Research", "Vendor Assessment"][i % 4],
  trustScore: Math.floor(Math.random() * 20) + 80,
  ownerAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
  chainId: 137,
  mintedAt: `2024-12-${String(15 - (i % 15)).padStart(2, "0")}T00:00:00Z`,
  image: `/nft-placeholder.svg`,
}))

export default function NFTsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = mockNFTs.filter(
    (nft) =>
      nft.surveyTitle.toLowerCase().includes(search.toLowerCase()) ||
      nft.tokenId.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tight">
            NFT Collection
          </motion.h1>
          <p className="text-muted-foreground mt-1">Verified survey response certificates on blockchain</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search NFTs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Image className="h-8 w-8 text-muted-foreground" />} title="No NFTs found" description="No NFT certificates match your search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((nft, i) => (
            <motion.div key={nft.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
              <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:shadow-electric-blue/10 hover:-translate-y-1" onClick={() => router.push(`/nfts/${nft.id}`)}>
                <div className="aspect-square bg-gradient-to-br from-electric-blue/20 via-purple/10 to-electric-blue/5 flex items-center justify-center relative">
                  <div className="text-center space-y-2 p-4">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-electric-blue/10">
                      <Image className="h-8 w-8 text-electric-blue" />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">#{nft.tokenId}</p>
                    <p className="text-sm font-semibold">{nft.surveyTitle}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="electric" className="text-[10px]">Polygon</Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trust Score</span>
                    <span className="text-sm font-bold text-electric-blue">{nft.trustScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Owner</span>
                    <span className="text-xs font-mono">{nft.ownerAddress.slice(0, 6)}...{nft.ownerAddress.slice(-4)}</span>
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
