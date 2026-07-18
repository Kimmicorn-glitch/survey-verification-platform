"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, Shield, Brain, Link as LinkIcon, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  className?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      id="main-content"
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden",
        "bg-white bg-mesh-hero",
        className
      )}
    >
      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-electric-blue mb-8">
            <Zap className="w-4 h-4" />
            Enterprise-Grade Survey Verification
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-charcoal mb-6 leading-[1.1]"
        >
          Trust Every Survey.
          <br />
          <span className="text-electric-blue">Verify Every Transaction.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl text-slate max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered fraud detection meets blockchain-backed certificates.
          The enterprise platform for survey verification, trust scoring, and
          immutable proof of authenticity.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/auth/register"
            className={cn(
              "group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl",
              "bg-electric-blue text-white",
              "hover:bg-electric-blue-dark transition-all duration-300",
              "shadow-lg shadow-electric-blue/20 hover:shadow-electric-blue/30",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            className={cn(
              "inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl",
              "border border-soft-grey text-charcoal bg-white",
              "hover:bg-ghost-white hover:border-charcoal/10 transition-all duration-300",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate mb-20"
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-electric-blue" />
            <span>AI Verification</span>
          </div>
          <div className="h-4 w-px bg-soft-grey" />
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-electric-blue" />
            <span>Blockchain Certificates</span>
          </div>
          <div className="h-4 w-px bg-soft-grey" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-electric-blue" />
            <span>Enterprise Security</span>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-electric-blue/5 via-electric-blue/10 to-electric-blue/5 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl border border-soft-grey/60 bg-white shadow-elevation-3 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-soft-grey/50 bg-ghost-white/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-soft-grey/80" />
                <div className="w-3 h-3 rounded-full bg-soft-grey/60" />
                <div className="w-3 h-3 rounded-full bg-soft-grey/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white text-xs text-muted-grey font-mono border border-soft-grey/50">
                  app.backofficepro.com
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="aspect-video bg-gradient-to-br from-ghost-white via-white to-ghost-white flex items-center justify-center p-8">
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl border border-soft-grey/50 bg-white shadow-elevation-1 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-electric-blue/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
