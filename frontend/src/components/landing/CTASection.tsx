"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  className?: string;
}

/**
 * CTASection - Premium call-to-action section.
 * No fake claims about user numbers.
 */
export function CTASection({ className }: CTASectionProps) {
  return (
    <section className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}>
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-charcoal">
          {/* Subtle mesh overlay */}
          <div className="absolute inset-0 bg-mesh opacity-50" />

          {/* Content */}
          <div className="relative z-10 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Verify?
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Start your free trial today. No credit card required.
              Enterprise support available from day one.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className={cn(
                  "group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl",
                  "bg-electric-blue text-white",
                  "hover:bg-electric-blue-light transition-all duration-300",
                  "shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/40",
                  "hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className={cn(
                  "inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                Talk to Sales
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/50">
              Free tier available. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
