import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | BackOffice Pro",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-electric-blue" />
            <span className="text-sm font-bold">
              <span className="text-foreground">BackOffice</span>
              <span className="text-electric-blue"> Pro</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 prose prose-invert prose-headings:font-bold prose-a:text-electric-blue">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2025</p>

        <h2>1. Introduction</h2>
        <p>
          BackOffice Pro (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Survey Verification Platform.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Account Information</h3>
        <p>
          When you create an account, we collect your name, email address, organization name, and password. This information is necessary to provide and manage your access to the Platform.
        </p>
        <h3>2.2 Survey Data</h3>
        <p>
          Survey responses submitted through the Platform are collected and stored securely. This includes text responses, ratings, file uploads, geolocation data (when enabled), and metadata such as device information and timestamps.
        </p>
        <h3>2.3 Blockchain Data</h3>
        <p>
          When blockchain verification is enabled, we store verification hashes and NFT metadata on public blockchains. These records are pseudonymous and do not directly identify individuals.
        </p>
        <h3>2.4 Usage Data</h3>
        <p>
          We automatically collect information about how you interact with the Platform, including IP address, browser type, operating system, pages visited, and actions taken within the Platform.
        </p>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve the Platform</li>
          <li>To process survey responses and generate verification reports</li>
          <li>To detect and prevent fraud using AI analysis</li>
          <li>To mint and manage NFT verification certificates</li>
          <li>To communicate with you about updates, security, and support</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 encryption in transit, SOC 2 Type II compliance, multi-factor authentication, and regular penetration testing. Despite our security measures, no method of transmission over the Internet is 100% secure.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active or as needed to provide services. Survey data is retained according to your organization&apos;s data retention policy. Blockchain records are immutable and permanently stored on public blockchains.
        </p>

        <h2>6. Your Rights (POPIA & GDPR)</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your personal data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>

        <h2>7. International Transfers</h2>
        <p>
          Your data may be processed in countries other than South Africa. We ensure appropriate safeguards are in place for international transfers in compliance with POPIA and GDPR requirements.
        </p>

        <h2>8. Cookies</h2>
        <p>
          We use essential cookies to maintain your session and preferences. Optional analytics cookies help us improve the Platform. You can manage cookie preferences through our Cookie Policy.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of material changes by posting a notice on the Platform or sending you an email.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For questions about this Privacy Policy or to exercise your rights:
          <br />
          Data Protection Officer
          <br />
          BackOffice Pro (Pty) Ltd
          <br />
          Email: privacy@backofficepro.com
          <br />
          Johannesburg, South Africa
        </p>
      </main>
    </div>
  )
}
