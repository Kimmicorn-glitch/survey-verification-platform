"use client"

import React from "react"
import { motion } from "framer-motion"
import { Wallet, Plus, ExternalLink, Copy, CheckCircle, Clock, XCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const wallets = [
  {
    id: "w1",
    address: "0x4a3d8f2e1b6c9a5d7e3f2b1c8a4d6e9f3a7b2c5d",
    chainId: 137,
    chainName: "Polygon",
    label: "Primary Wallet",
    isPrimary: true,
    balance: "2,847.32 MATIC",
  },
  {
    id: "w2",
    address: "0x9b7c2e4f5d8a1b3c6e9f2a5d8b4c7e1f3a6d9b2c",
    chainId: 1,
    chainName: "Ethereum",
    label: "Operations",
    isPrimary: false,
    balance: "1.234 ETH",
  },
]

const transactions = [
  { id: "t1", hash: "0xabc123...def456", type: "mint", status: "confirmed", value: "NFT #4821", from: "0x4a3d...2c5d", to: "Contract", date: "2024-12-15" },
  { id: "t2", hash: "0xdef789...ghi012", type: "mint", status: "confirmed", value: "NFT #4820", from: "0x4a3d...2c5d", to: "Contract", date: "2024-12-14" },
  { id: "t3", hash: "0xghi345...jkl678", type: "transfer", status: "pending", value: "NFT #4818", from: "Contract", to: "0x9b7c...9b2c", date: "2024-12-14" },
  { id: "t4", hash: "0xjkl901...mno234", type: "payment", status: "confirmed", value: "50 MATIC", from: "0x4a3d...2c5d", to: "0x9b7c...9b2c", date: "2024-12-13" },
  { id: "t5", hash: "0xmno567...pqr890", type: "approval", status: "failed", value: "NFT #4815", from: "0x9b7c...9b2c", to: "Contract", date: "2024-12-12" },
]

const txIcons: Record<string, React.ReactNode> = {
  mint: <ArrowDownLeft className="h-4 w-4 text-green-500" />,
  transfer: <ArrowUpRight className="h-4 w-4 text-electric-blue" />,
  payment: <ArrowUpRight className="h-4 w-4 text-yellow-500" />,
  approval: <ArrowDownLeft className="h-4 w-4 text-purple-light" />,
}

const txStatusBadge: Record<string, { variant: "success" | "info" | "destructive"; label: string }> = {
  confirmed: { variant: "success", label: "Confirmed" },
  pending: { variant: "info", label: "Pending" },
  failed: { variant: "destructive", label: "Failed" },
}

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tight">
            Wallet
          </motion.h1>
          <p className="text-muted-foreground mt-1">Manage connected wallets and transactions</p>
        </div>
        <Button className="bg-electric-blue hover:bg-electric-blue-dark">
          <Plus className="mr-2 h-4 w-4" />Connect Wallet
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {wallets.map((wallet, i) => (
          <motion.div key={wallet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-electric-blue/10 to-transparent rounded-bl-full" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-blue/10">
                      <Wallet className="h-5 w-5 text-electric-blue" />
                    </div>
                    <div>
                      <p className="font-semibold">{wallet.label}</p>
                      <Badge variant={wallet.isPrimary ? "electric" : "secondary"} className="text-[10px] mt-0.5">
                        {wallet.chainName}
                      </Badge>
                    </div>
                  </div>
                  {wallet.isPrimary && <Badge variant="success">Primary</Badge>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">{wallet.address}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Copy className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><ExternalLink className="h-3 w-3" /></Button>
                  </div>
                  <p className="text-2xl font-bold text-electric-blue">{wallet.balance}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Type</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Hash</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Value</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {txIcons[tx.type]}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><code className="font-mono text-xs">{tx.hash}</code></td>
                      <td className="px-4 py-3 font-medium">{tx.value}</td>
                      <td className="px-4 py-3">
                        <Badge variant={txStatusBadge[tx.status]?.variant}>{txStatusBadge[tx.status]?.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfts" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Your wallet NFTs will appear here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
