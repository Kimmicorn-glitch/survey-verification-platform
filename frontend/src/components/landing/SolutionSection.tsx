"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight } from "lucide-react";

interface SolutionSectionProps {
  className?: string;
}

const solutions = [
  {
    title: "AI-Powered Verification",
    description:
      "Our Rust-based AI engine analyzes every response in real-time, scoring trustworthiness across multiple dimensions.",
  },
  {
    title: "Blockchain Certificates",
    description:
      "Verified surveys are minted as immutable NFT certificates, providing tamper-proof proof of authenticity.",
  },
  {
    title: "Zero Trust Security",
    description:
      "Every request is authenticated and authorized. No implicit trust, ever. Enterprise-grade protection built in.",
  },
  {
    title: "Real-time Analytics",
    description:
      "Monitor survey integrity, trust scores, and fraud indicators with comprehensive dashboards and reporting.",
  },
];

/**
 * SolutionSection - Solution overview with checkmarks.
 * Shows how the platform solves the problems.
 */
export function SolutionSection({ className }: SolutionSectionProps) {
  return (
    <section className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <CheckCircle className="w-4 h-4 text-electric-blue" />
              <span className="text-sm font-medium text-electric-blue">
                The Solution
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-charcoal">
              <span className="text-charcoal">Verify. </span>
              <span className="text-electric-blue">Certify. </span>
              <span className="text-charcoal">Trust.</span>
            </h2>
            <p className="text-lg text-slate mb-8 leading-relaxed">
              The Survey Verification Platform combines artificial intelligence
              with blockchain technology to create the world&apos;s most trusted
              survey verification system. Every response is analyzed, verified,
              and certified on-chain.
            </p>

            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <div key={index} className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-electric-blue shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {solution.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {solution.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-electric-blue hover:underline font-medium text-sm group"
              >
                Explore all features
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-electric-blue/5 via-electric-blue/10 to-electric-blue/5 rounded-3xl blur-2xl" />
            <div className="relative bg-white border border-soft-grey/60 rounded-3xl p-8 space-y-6 shadow-elevation-2">
              {/* Trust Score Visualization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Trust Score
                  </span>
                  <span className="text-sm font-bold text-green-500">98.7%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-electric-blue"
                    style={{ width: "98.7%" }}
                  />
                </div>
              </div>

              {/* Verification Steps */}
              <div className="space-y-3">
                {[
                  { step: "AI Analysis", status: "complete", time: "0.3s" },
                  { step: "Geo Validation", status: "complete", time: "0.1s" },
                  { step: "Fraud Detection", status: "complete", time: "0.2s" },
                  { step: "Blockchain Mint", status: "complete", time: "2.1s" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-foreground">{item.step}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* NFT Certificate Preview */}
              <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-electric-blue/5 to-purple/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-electric-blue to-purple flex items-center justify-center">
                    <span className="text-xs text-white font-bold">N</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    NFT Certificate #4821
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verified survey response with on-chain proof of authenticity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SolutionSection;
