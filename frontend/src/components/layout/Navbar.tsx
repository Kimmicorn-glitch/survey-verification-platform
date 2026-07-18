"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Shield, Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-soft-grey/50 shadow-elevation-1"
          : "bg-transparent",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="BackOffice Pro Home">
            <div className="relative">
              <Shield className="w-7 h-7 text-electric-blue transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 w-7 h-7 bg-electric-blue/10 rounded-full blur-md group-hover:bg-electric-blue/20 transition-colors" />
            </div>
            <span className="text-lg font-bold tracking-tight text-charcoal">
              BackOffice
              <span className="text-electric-blue"> Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "#features", label: "Features" },
              { href: "#architecture", label: "Architecture" },
              { href: "#pricing", label: "Pricing" },
              { href: "#security", label: "Security" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-slate hover:text-charcoal transition-colors rounded-lg hover:bg-ghost-white group"
              >
                {link.label}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-electric-blue scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-slate hover:text-charcoal transition-colors rounded-lg hover:bg-ghost-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className={cn(
                "group inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-lg",
                "bg-electric-blue text-white",
                "hover:bg-electric-blue-dark transition-all duration-200",
                "shadow-sm shadow-electric-blue/20 hover:shadow-md hover:shadow-electric-blue/25",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-ghost-white transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5 text-charcoal" /> : <Menu className="w-5 h-5 text-charcoal" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-soft-grey/50 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {[
                { href: "#features", label: "Features" },
                { href: "#architecture", label: "Architecture" },
                { href: "#pricing", label: "Pricing" },
                { href: "#security", label: "Security" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-slate hover:text-charcoal hover:bg-ghost-white rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-soft-grey/50 space-y-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-slate hover:text-charcoal hover:bg-ghost-white rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-sm font-semibold text-center rounded-lg bg-electric-blue text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
