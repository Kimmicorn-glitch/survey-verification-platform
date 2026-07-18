"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";

interface ContactSectionProps {
  className?: string;
}

/**
 * ContactSection - Enterprise contact form and information.
 * Provides multiple contact channels for different needs.
 */
export function ContactSection({ className }: ContactSectionProps) {
  return (
    <section
      id="contact"
      className={cn("py-24 px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Contact Info */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Mail className="w-4 h-4 text-electric-blue" />
              <span className="text-sm font-medium text-electric-blue">
                Get in Touch
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-charcoal">
              <span className="text-charcoal">Let&apos;s </span>
              <span className="text-electric-blue">Connect</span>
            </h2>
            <p className="text-lg text-slate mb-8">
              Have questions about the platform? Need a custom enterprise solution?
              Our team is here to help.
            </p>

            <div className="space-y-4">
              <ContactInfo
                icon={Mail}
                label="Email"
                value="enterprise@backofficepro.com"
              />
              <ContactInfo
                icon={Phone}
                label="Phone"
                value="Contact us via email"
              />
              <ContactInfo
                icon={MapPin}
                label="Location"
                value="Johannesburg, South Africa"
              />
              <ContactInfo
                icon={MessageSquare}
                label="Support"
                value="support@backofficepro.com"
              />
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white border border-soft-grey/60 rounded-2xl p-8 shadow-elevation-2">
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-first-name" className="block text-sm font-medium text-charcoal mb-2">
                    First Name
                  </label>
                  <input
                    id="contact-first-name"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-ghost-white border border-soft-grey text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="contact-last-name" className="block text-sm font-medium text-charcoal mb-2">
                    Last Name
                  </label>
                  <input
                    id="contact-last-name"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-ghost-white border border-soft-grey text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-charcoal mb-2">
                    Work Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl bg-ghost-white border border-soft-grey text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label htmlFor="contact-company" className="block text-sm font-medium text-charcoal mb-2">
                    Company
                  </label>
                  <input
                    id="contact-company"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-ghost-white border border-soft-grey text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all"
                  placeholder="Acme Inc"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-charcoal mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-ghost-white border border-soft-grey text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "w-full px-6 py-3 rounded-xl text-sm font-semibold",
                  "bg-electric-blue text-white",
                  "hover:bg-electric-blue-dark transition-all duration-300",
                  "shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/40"
                )}
              >
                Send Message
              </button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our{" "}
                <a href="/legal/privacy" className="text-electric-blue hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-electric-blue" />
      </div>
      <div>
                    <p className="text-xs text-slate">{label}</p>
                    <p className="text-sm font-medium text-charcoal">{value}</p>
      </div>
    </div>
  );
}

export default ContactSection;
