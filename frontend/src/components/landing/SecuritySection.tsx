"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Key,
  Server,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SecuritySectionProps {
  className?: string;
}

const securityFeatures = [
  {
    icon: Lock,
    title: "JWT Authentication",
    description:
      "Industry-standard JSON Web Tokens with refresh token rotation, short-lived access tokens, and secure HTTP-only cookie storage.",
  },
  {
    icon: Key,
    title: "OAuth2 & SSO",
    description:
      "Enterprise single sign-on with OAuth2, SAML, and OpenID Connect. Support for Google, Microsoft, and custom identity providers.",
  },
  {
    icon: Shield,
    title: "RBAC & ABAC",
    description:
      "Fine-grained role-based and attribute-based access control. Define custom policies for data access and operations.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description:
      "Comprehensive audit trails for every action. Track who did what, when, and from where with immutable audit logs.",
  },
  {
    icon: Server,
    title: "Encrypted Storage",
    description:
      "AES-256 encryption at rest, TLS 1.3 in transit. Hardware security modules for key management.",
  },
  {
    icon: AlertTriangle,
    title: "Threat Detection",
    description:
      "Real-time monitoring for SQL injection, XSS, CSRF, and other OWASP Top 10 vulnerabilities with automated blocking.",
  },
  {
    icon: FileCheck,
    title: "Compliance",
    description:
      "GDPR, POPIA, and SOC 2 compliant. Data processing agreements, privacy controls, and right to erasure built in.",
  },
  {
    icon: CheckCircle,
    title: "Zero Trust Architecture",
    description:
      "Never trust, always verify. Every request is authenticated and authorized regardless of network location.",
  },
];

/**
 * SecuritySection - Enterprise security features showcase.
 * Highlights the zero trust security architecture.
 */
export function SecuritySection({ className }: SecuritySectionProps) {
  return (
    <section
      id="security"
      className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Shield className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              Enterprise Security
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Built for </span>
            <span className="text-electric-blue">Zero Trust</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            Security is not an afterthought. Every component is designed with
            defense-in-depth principles and OWASP Top 10 compliance.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-4 p-6 rounded-2xl bg-white border border-soft-grey/60 shadow-elevation-1",
                "hover:shadow-elevation-2 transition-all duration-300"
              )}
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-electric-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {["SOC 2 Type II", "GDPR", "POPIA", "ISO 27001", "OWASP Top 10"].map(
            (badge) => (
              <div
                key={badge}
                className="px-6 py-3 rounded-xl bg-white border border-soft-grey/60 text-sm font-medium text-slate"
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default SecuritySection;
