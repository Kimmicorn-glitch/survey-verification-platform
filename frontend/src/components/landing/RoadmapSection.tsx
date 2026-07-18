"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Map, CheckCircle, Clock, Circle } from "lucide-react";

interface RoadmapSectionProps {
  className?: string;
}

const milestones = [
  {
    quarter: "Q1 2026",
    title: "Foundation",
    status: "completed",
    items: [
      "Platform architecture & DDD design",
      "Core backend with Spring Boot",
      "React frontend with Next.js",
      "Rust AI engine MVP",
      "ERC-721 smart contracts",
    ],
  },
  {
    quarter: "Q2 2026",
    title: "Core Features",
    status: "completed",
    items: [
      "Survey builder & management",
      "AI verification pipeline",
      "NFT certificate minting",
      "Wallet integration",
      "Authentication & security",
    ],
  },
  {
    quarter: "Q3 2026",
    title: "Enterprise",
    status: "in_progress",
    items: [
      "Enterprise dashboard",
      "Advanced analytics",
      "API & webhook integrations",
      "Compliance certifications",
      "Performance optimization",
    ],
  },
  {
    quarter: "Q4 2026",
    title: "Scale",
    status: "planned",
    items: [
      "Kubernetes deployment",
      "Multi-region support",
      "Advanced AI models",
      "Cross-chain NFTs",
      "Enterprise SSO",
    ],
  },
  {
    quarter: "2027",
    title: "Future",
    status: "planned",
    items: [
      "Programmable Banking",
      "Open Banking / PayShap",
      "DID & Verifiable Credentials",
      "DAO Governance",
      "Offline Synchronisation",
    ],
  },
];

/**
 * RoadmapSection - Product roadmap with timeline.
 * Shows current progress and future plans.
 */
export function RoadmapSection({ className }: RoadmapSectionProps) {
  return (
    <section
      id="roadmap"
      className={cn("py-24 px-4 sm:px-6 lg:px-8 bg-ghost-white", className)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Map className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              Roadmap
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Product </span>
            <span className="text-electric-blue">Roadmap</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            Our journey to build the world&apos;s most trusted survey verification platform.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-soft-grey hidden md:block" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex flex-col md:flex-row gap-8",
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Content */}
                <div className="flex-1">
                    <div
                      className={cn(
                        "rounded-2xl p-6 bg-white border shadow-elevation-1",
                        milestone.status === "completed" && "border-green-200",
                        milestone.status === "in_progress" && "border-electric-blue/30",
                        milestone.status === "planned" && "border-soft-grey/60"
                      )}
                    >
                    <div className="flex items-center gap-2 mb-3">
                      <StatusIcon status={milestone.status} />
                      <span className="text-xs font-medium text-slate">
                        {milestone.quarter}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mb-3">
                      {milestone.title}
                    </h3>
                    <ul className="space-y-2">
                      {milestone.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate"
                        >
                          <CheckCircle
                            className={cn(
                              "w-4 h-4 mt-0.5 shrink-0",
                              milestone.status === "completed"
                                ? "text-green-500"
                                : "text-slate/40"
                            )}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "in_progress":
      return <Clock className="w-4 h-4 text-electric-blue" />;
    default:
      return <Circle className="w-4 h-4 text-slate/40" />;
  }
}

export default RoadmapSection;
