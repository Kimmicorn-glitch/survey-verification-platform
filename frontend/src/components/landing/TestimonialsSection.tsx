"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Building2, Users, Rocket } from "lucide-react";
import Link from "next/link";

interface TestimonialsSectionProps {
  className?: string;
}

const programmes = [
  {
    icon: Building2,
    title: "Enterprise Pilot Programme",
    description:
      "We're inviting select organisations to pilot the Survey Verification Platform. Get dedicated support, custom integration assistance, and shape the product roadmap.",
    cta: "Apply for Pilot",
    href: "/contact",
  },
  {
    icon: Rocket,
    title: "Early Access Programme",
    description:
      "Join our early access community and be among the first to experience AI-powered survey verification with blockchain-backed certificates.",
    cta: "Request Access",
    href: "/auth/register",
  },
  {
    icon: Users,
    title: "Become Our First Enterprise Partner",
    description:
      "We're looking for forward-thinking organisations to co-create the future of survey verification. Partners receive preferential pricing and dedicated engineering support.",
    cta: "Become a Partner",
    href: "/contact",
  },
];

/**
 * TestimonialsSection - Legitimate social proof and partnership opportunities.
 * No fake testimonials — only real programmes and coming-soon content.
 */
export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  return (
    <section className={cn("py-24 px-4 sm:px-6 lg:px-8 bg-ghost-white", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            Case Studies Coming Soon
          </h2>
          <p className="text-lg text-slate max-w-2xl mx-auto">
            We&apos;re building the platform with real enterprise partners.
            Here&apos;s how you can get involved.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programmes.map((programme, index) => (
            <div
              key={index}
              className={cn(
                "group p-8 rounded-2xl bg-white border border-soft-grey/60",
                "shadow-elevation-1 hover:shadow-elevation-3 hover:border-electric-blue/20",
                "transition-all duration-400 ease-out",
                "hover:-translate-y-1"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-electric-blue/10 transition-colors">
                <programme.icon className="w-6 h-6 text-electric-blue" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal mb-3">
                {programme.title}
              </h3>
              <p className="text-sm text-slate leading-relaxed mb-6">
                {programme.description}
              </p>
              <Link
                href={programme.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-electric-blue hover:text-electric-blue-dark transition-colors"
              >
                {programme.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
