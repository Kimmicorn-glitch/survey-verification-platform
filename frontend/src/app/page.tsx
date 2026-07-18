"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/landing/ContactSection";

/**
 * Landing Page - Enterprise marketing page for BackOffice Pro.
 * Composes all landing page sections into a complete page.
 */
export default function HomePage() {
  return (
    <main className="relative bg-white">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <ArchitectureSection />
      <SecuritySection />
      <PricingSection />
      <TestimonialsSection />
      <RoadmapSection />
      <FAQSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </main>
  );
}
