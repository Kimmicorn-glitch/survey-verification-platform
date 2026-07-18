"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Shield, Github, Twitter, Linkedin } from "lucide-react";

interface FooterProps {
  className?: string;
}

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
    { label: "Roadmap", href: "#roadmap" },
    { label: "API", href: "/docs/api" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Partners", href: "/partners" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Architecture", href: "/docs/architecture" },
    { label: "Contributing", href: "/contributing" },
    { label: "Changelog", href: "/changelog" },
  ],
  legal: [
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "GDPR", href: "/legal/gdpr" },
    { label: "POPIA", href: "/legal/popia" },
    { label: "SLA", href: "/legal/sla" },
  ],
};

/**
 * Footer - Enterprise-grade footer with BackOffice Pro branding.
 * Contains product links, company info, legal pages, and social links.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-soft-grey/60 bg-ghost-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-electric-blue" />
              <span className="text-sm font-bold text-charcoal">
                BackOffice
                <span className="text-electric-blue"> Pro</span>
              </span>
            </Link>
            <p className="text-sm text-slate mb-4 max-w-xs">
              Trust Every Survey. Verify Every Transaction.
              Enterprise-grade survey verification powered by AI and blockchain.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://github.com/backofficepro" icon={Github} label="GitHub" />
              <SocialLink href="https://twitter.com/backofficepro" icon={Twitter} label="Twitter" />
              <SocialLink href="https://linkedin.com/company/backofficepro" icon={Linkedin} label="LinkedIn" />
            </div>
          </div>

          {/* Link Columns */}
          <FooterColumn title="Product" links={footerLinks.product} />
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Resources" links={footerLinks.resources} />
          <FooterColumn title="Legal" links={footerLinks.legal} />
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-soft-grey/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate">
            &copy; {new Date().getFullYear()} BackOffice Pro (Pty) Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-grey">
              Powered by AI. Secured by Blockchain.
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-charcoal mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-slate hover:text-charcoal transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

export default Footer;
