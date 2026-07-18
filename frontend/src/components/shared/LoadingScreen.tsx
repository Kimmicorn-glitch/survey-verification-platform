"use client"

import React from "react"
import { Shield } from "lucide-react"
import { motion } from "framer-motion"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-mesh opacity-50" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center gap-6"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="w-16 h-16 text-electric-blue" />
          </motion.div>
          <div className="absolute inset-0 w-16 h-16 bg-electric-blue/20 rounded-full blur-xl animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">
            <span className="text-foreground">BackOffice</span>
            <span className="text-electric-blue"> Pro</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Survey Verification Platform
          </p>
        </div>

        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-electric-blue"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default LoadingScreen
