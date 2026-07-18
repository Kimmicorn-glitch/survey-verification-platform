"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQSectionProps {
  className?: string;
}

const faqs = [
  {
    question: "What is the Survey Verification Platform?",
    answer:
      "The Survey Verification Platform is an enterprise-grade SaaS application built by BackOffice Pro that combines AI-powered fraud detection with blockchain-backed NFT certificates to ensure survey authenticity and trust. It provides real-time verification, geospatial validation, and immutable on-chain proof of survey completion.",
  },
  {
    question: "How does AI verification work?",
    answer:
      "Our Rust-based AI engine analyzes survey responses in real-time using multiple models: behaviour analysis (response patterns, timing), geolocation validation (GPS coordinates, geohash matching), duplicate detection (content similarity, device fingerprinting), and identity verification (cross-referencing with known patterns). Each response receives a trust score from 0-100 based on these analyses.",
  },
  {
    question: "What blockchain do you use for NFT certificates?",
    answer:
      "We deploy ERC-721 smart contracts on Ethereum-compatible networks. Each verified survey generates an immutable NFT certificate containing the verification hash, timestamp, geohash, wallet address, and trust score. Importantly, no actual survey answers are stored on-chain - only cryptographic hashes for privacy protection.",
  },
  {
    question: "Is the platform GDPR and POPIA compliant?",
    answer:
      "Yes. The platform is designed with privacy-first principles. We implement data processing agreements, consent management, right to erasure, data portability, encryption at rest and in transit, and comprehensive audit logging. We maintain full compliance with both GDPR (EU) and POPIA (South Africa) regulations.",
  },
  {
    question: "Can I integrate with existing systems?",
    answer:
      "Absolutely. The platform provides a comprehensive RESTful API with OpenAPI documentation, webhook support, and SDKs for popular languages. We also support OAuth2/SSO integration, custom identity providers, and can build bespoke integrations for enterprise clients.",
  },
  {
    question: "What pricing plans are available?",
    answer:
      "We offer a free tier for evaluation (5 surveys/month), Starter ($49/month for small teams), Professional ($199/month with full features), and Enterprise (custom pricing with dedicated support, white-label options, and on-premise deployment). All paid plans include a 14-day free trial.",
  },
  {
    question: "How do wallet connections work?",
    answer:
      "We integrate with WalletConnect, MetaMask, and other popular Web3 wallets. Users can connect their wallet to receive NFT certificates, view their verification history, and manage their on-chain credentials. The platform supports multiple EVM-compatible chains.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "Free tier includes community support. Starter plans get email support with 24-hour response time. Professional plans receive priority support with 4-hour response time. Enterprise clients get dedicated support with 1-hour response time, a named account manager, and custom SLA terms.",
  },
];

/**
 * FAQSection - Frequently asked questions with accordion interface.
 * Addresses common questions about the platform.
 */
export function FAQSection({ className }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <HelpCircle className="w-4 h-4 text-electric-blue" />
            <span className="text-sm font-medium text-electric-blue">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
            <span className="text-charcoal">Frequently Asked </span>
            <span className="text-electric-blue">Questions</span>
          </h2>
          <p className="text-lg text-slate">
            Everything you need to know about the platform.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FAQItemProps {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={cn("rounded-2xl bg-white border border-soft-grey/60 shadow-elevation-1 overflow-hidden transition-all duration-300")}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-charcoal pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate shrink-0 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-6 pb-6 text-sm text-slate leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export default FAQSection;
