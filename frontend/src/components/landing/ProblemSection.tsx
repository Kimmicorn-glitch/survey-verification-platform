"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingDown, Shield, Clock } from "lucide-react";

interface ProblemSectionProps {
  className?: string;
}

const problems = [
  {
    icon: AlertTriangle,
    stat: "42%",
    title: "of surveys contain fraudulent data",
    description:
      "Bot submissions, duplicate responses, and intentional manipulation compromise survey integrity across industries.",
  },
  {
    icon: TrendingDown,
    stat: "$4.7M",
    title: "average cost of survey fraud",
    description:
      "Enterprises lose millions annually to unreliable data, leading to poor decisions and compliance failures.",
  },
  {
    icon: Shield,
    stat: "78%",
    title: "lack verification mechanisms",
    description:
      "Most survey platforms provide zero verification, leaving organizations blind to data quality issues.",
  },
  {
    icon: Clock,
    stat: "3.2x",
    title: "longer verification with manual processes",
    description:
      "Manual verification is slow, expensive, and doesn't scale. Teams spend weeks validating what AI can verify in seconds.",
  },
];

/**
 * ProblemSection - Problem statement with statistics.
 * Highlights the pain points that the platform solves.
 */
export function ProblemSection({ className }: ProblemSectionProps) {
  return (
    <section className={cn("py-24 px-4 sm:px-6 lg:px-8 bg-ghost-white", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">
              The Problem
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Survey Data is </span>
            <span className="text-red-500">Broken</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            Organizations waste billions on unreliable survey data. The status quo
            of trust-nothing is unsustainable.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <div
              key={index}
              className={cn(
                "p-6 rounded-2xl bg-white border border-soft-grey/60 shadow-elevation-1",
                "hover:shadow-elevation-2 transition-all duration-300"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <problem.icon className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-500 mb-2">
                {problem.stat}
              </div>
              <h3 className="text-base font-semibold text-charcoal mb-2">
                {problem.title}
              </h3>
              <p className="text-sm text-slate leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
