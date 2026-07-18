"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, Sparkles } from "lucide-react";

interface PricingSectionProps {
  className?: string;
}

const plans = [
  {
    name: "Free",
    description: "Perfect for evaluating the platform",
    price: "0",
    period: "forever",
    features: [
      "5 surveys per month",
      "100 responses per survey",
      "Basic AI verification",
      "Community support",
      "Standard NFT certificates",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    description: "For small teams getting started",
    price: "49",
    period: "per month",
    features: [
      "25 surveys per month",
      "1,000 responses per survey",
      "Advanced AI verification",
      "Email support",
      "Custom NFT branding",
      "Geo-validation",
      "Basic analytics",
    ],
    cta: "Start Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing organizations",
    price: "199",
    period: "per month",
    features: [
      "Unlimited surveys",
      "10,000 responses per survey",
      "Full AI fraud detection",
      "Priority support",
      "Custom NFT metadata",
      "Advanced geo-validation",
      "Real-time analytics",
      "API access",
      "Webhook integrations",
      "Team collaboration",
    ],
    cta: "Start Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale deployments",
    price: "Custom",
    period: "contact us",
    features: [
      "Everything in Professional",
      "Unlimited responses",
      "Custom AI model training",
      "Dedicated support",
      "White-label options",
      "On-premise deployment",
      "Custom integrations",
      "SLA guarantee",
      "SOC 2 compliance",
      "Multi-tenant architecture",
      "DRRT governance engine",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

/**
 * PricingSection - Enterprise pricing tiers with glassmorphism design.
 * Features the BackOffice Pro pricing structure.
 */
export function PricingSection({ className }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className={cn("py-24 px-4 sm:px-6 lg:px-8 bg-ghost-white", className)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <Sparkles className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              Simple Pricing
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Choose Your </span>
            <span className="text-electric-blue">Plan</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            Transparent pricing for teams of all sizes. Start free and scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} />
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need a custom solution?{" "}
            <Link
              href="/contact"
              className="text-electric-blue hover:underline font-medium"
            >
              Talk to our enterprise team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  plan: {
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    highlighted: boolean;
  };
  index: number;
}

function PricingCard({ plan, index }: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col p-6 rounded-2xl transition-all duration-300",
        plan.highlighted
          ? "bg-white border-2 border-electric-blue/30 shadow-elevation-3 scale-[1.02]"
          : "bg-white border border-soft-grey/60 shadow-elevation-1 hover:shadow-elevation-2"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-electric-blue text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-charcoal">{plan.name}</h3>
        <p className="text-sm text-slate mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          {plan.price !== "Custom" && (
            <span className="text-sm text-slate">$</span>
          )}
          <span className="text-4xl font-bold text-charcoal">{plan.price}</span>
        </div>
        <span className="text-sm text-slate">{plan.period}</span>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-electric-blue mt-0.5 shrink-0" />
            <span className="text-slate">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.name === "Enterprise" ? "/contact" : "/auth/register"}
        className={cn(
          "group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
          plan.highlighted
            ? "bg-electric-blue text-white hover:bg-electric-blue-dark shadow-sm shadow-electric-blue/20"
            : "border border-soft-grey text-charcoal hover:bg-ghost-white"
        )}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default PricingSection;
