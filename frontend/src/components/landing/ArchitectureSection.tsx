"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Cpu, Database, Globe, Layers, Server, Wifi } from "lucide-react";

interface ArchitectureSectionProps {
  className?: string;
}

/**
 * ArchitectureSection - Visual architecture overview.
 * Shows the system architecture with BackOffice Pro's technology stack.
 */
export function ArchitectureSection({ className }: ArchitectureSectionProps) {
  return (
    <section
      id="architecture"
      className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Layers className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              Architecture
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Built with </span>
            <span className="text-electric-blue">Enterprise Patterns</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            Domain-Driven Design, Hexagonal Architecture, CQRS, and Event-Driven
            patterns power every layer of the platform.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative">
          {/* Architecture Layers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Frontend Layer */}
            <ArchitectureCard
              title="Frontend"
              subtitle="React / Next.js"
              items={[
                "Next.js 15+ with App Router",
                "TypeScript & TailwindCSS",
                "shadcn/ui Components",
                "Framer Motion Animations",
                "React Query Data Layer",
                "WalletConnect Integration",
              ]}
              icon={Globe}
              color="electric-blue"
            />

            {/* Backend Layer */}
            <ArchitectureCard
              title="Backend"
              subtitle="Java 21 / Spring Boot"
              items={[
                "DDD Bounded Contexts",
                "CQRS with Event Sourcing",
                "Spring Security & OAuth2",
                "PostgreSQL Database",
                "Redis Cache Layer",
                "Audit Logging Framework",
              ]}
              icon={Server}
              color="electric-blue"
            />

            {/* AI Engine Layer */}
            <ArchitectureCard
              title="AI Engine"
              subtitle="Rust / Axum"
              items={[
                "Tokio Async Runtime",
                "GPS Verification",
                "Fraud Detection Algorithms",
                "Trust Score Calculation",
                "ONNX Runtime Integration",
                "DRRT Governance (Future)",
              ]}
              icon={Cpu}
              color="electric-blue"
            />
          </div>

          {/* Infrastructure Layer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArchitectureCard
              title="Blockchain"
              subtitle="Solidity / Hardhat"
              items={[
                "ERC-721 NFT Certificates",
                "Verification Registry",
                "GeoValidation Contracts",
                "Trust Score Oracle",
                "OpenZeppelin Security",
                "Multi-chain Support",
              ]}
              icon={Wifi}
              color="electric-blue"
            />

            <ArchitectureCard
              title="Infrastructure"
              subtitle="Docker / Kubernetes"
              items={[
                "Docker Compose Development",
                "Kubernetes Production",
                "Prometheus & Grafana",
                "Loki & Tempo Tracing",
                "GitHub Actions CI/CD",
                "Nginx Reverse Proxy",
              ]}
              icon={Database}
              color="electric-blue"
            />
          </div>

          {/* Connection Lines */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0, 102, 255, 0.3)" />
                  <stop offset="50%" stopColor="rgba(124, 58, 237, 0.3)" />
                  <stop offset="100%" stopColor="rgba(0, 102, 255, 0.3)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* DDD Principles */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-4">
            {[
              "Domain Driven Design",
              "Clean Architecture",
              "SOLID Principles",
              "Hexagonal Architecture",
              "Twelve-Factor App",
              "Event-Driven",
            ].map((principle) => (
              <span
                key={principle}
                className="px-4 py-2 rounded-full glass text-sm text-muted-foreground"
              >
                {principle}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ArchitectureCardProps {
  title: string;
  subtitle: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: "electric-blue";
}

function ArchitectureCard({
  title,
  subtitle,
  items,
  icon: Icon,
  color,
}: ArchitectureCardProps) {
  return (
    <div className="bg-white border border-soft-grey/60 rounded-2xl p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-electric-blue" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-charcoal">{title}</h3>
          <p className="text-xs text-slate">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-sm text-slate"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ArchitectureSection;
