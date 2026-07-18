"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Shield,
  Brain,
  Link,
  MapPin,
  AlertTriangle,
  Wallet,
  FileCheck,
  BarChart3,
  Users,
  Lock,
  Zap,
  Globe,
} from "lucide-react";

interface FeaturesSectionProps {
  className?: string;
}

const features = [
  {
    icon: Brain,
    title: "AI-Powered Verification",
    description:
      "Advanced machine learning algorithms analyze survey responses in real-time, detecting anomalies, fraud patterns, and bot activity with 99.7% accuracy.",
    gradient: "from-electric-blue/5 to-blue-100",
  },
  {
    icon: Link,
    title: "Blockchain Certificates",
    description:
      "Every verified survey is minted as an immutable ERC-721 NFT certificate on-chain, providing tamper-proof proof of authenticity.",
    gradient: "from-blue-100 to-electric-blue/5",
  },
  {
    icon: MapPin,
    title: "Geospatial Validation",
    description:
      "GPS-based location verification ensures survey responses originate from expected geographic areas with geohash precision.",
    gradient: "from-electric-blue/10 to-green-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Detection Engine",
    description:
      "Multi-layered fraud detection identifies duplicate responses, bot submissions, timing anomalies, and identity mismatches in real-time.",
    gradient: "from-red-500/10 to-orange-500/10",
  },
  {
    icon: Wallet,
    title: "Web3 Wallet Integration",
    description:
      "Connect with MetaMask, WalletConnect, and popular wallets. Manage NFT certificates and verify on-chain credentials seamlessly.",
    gradient: "from-electric-blue/5 to-pink-50",
  },
  {
    icon: Shield,
    title: "Zero Trust Security",
    description:
      "Enterprise-grade security with JWT authentication, OAuth2, RBAC/ABAC, rate limiting, audit logging, and OWASP Top 10 compliance.",
    gradient: "from-electric-blue/10 to-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Trust Score Analytics",
    description:
      "Comprehensive trust scoring with AI analysis of behaviour patterns, geolocation consistency, response quality, and reputation metrics.",
    gradient: "from-green-500/10 to-electric-blue/10",
  },
  {
    icon: FileCheck,
    title: "Survey Builder",
    description:
      "Enterprise survey builder with 15+ question types, branching logic, conditional rules, and real-time response collection.",
    gradient: "from-electric-blue/10 to-indigo-500/10",
  },
  {
    icon: Users,
    title: "Enterprise Administration",
    description:
      "Multi-tenant architecture with role-based access control, team management, audit trails, and compliance reporting.",
    gradient: "from-electric-blue/5 to-blue-50",
  },
  {
    icon: Lock,
    title: "Data Protection",
    description:
      "GDPR and POPIA compliant data handling with encrypted storage, data processing agreements, and privacy-first architecture.",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description:
      "Sub-second verification processing with event-driven architecture, CQRS patterns, and high-performance Rust AI engine.",
    gradient: "from-yellow-500/10 to-orange-500/10",
  },
  {
    icon: Globe,
    title: "API-First Platform",
    description:
      "RESTful API with OpenAPI documentation, webhooks, SDKs, and integration support for enterprise systems.",
    gradient: "from-electric-blue/10 to-violet-500/10",
  },
];

/**
 * FeaturesSection - Premium features grid with glassmorphism cards.
 * Showcases all major platform capabilities.
 */
export function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section
      id="features"
      className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Zap className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              Platform Capabilities
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Enterprise-Grade </span>
            <span className="text-electric-blue">Verification</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            A comprehensive suite of tools designed for enterprise survey management,
            verification, and blockchain-backed certification.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    gradient: string;
  };
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl bg-white border border-soft-grey/60 shadow-elevation-1",
        "hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all duration-300",
        "cursor-default"
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-br ${feature.gradient}`
        )}
      />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-electric-blue/10 transition-colors">
          <feature.icon className="w-6 h-6 text-electric-blue" />
        </div>
        <h3 className="text-lg font-semibold text-charcoal mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-slate leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default FeaturesSection;
