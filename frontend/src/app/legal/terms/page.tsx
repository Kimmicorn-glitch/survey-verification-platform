import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Terms of Service | BackOffice Pro",
}

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2025</p>

        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using the Survey Verification Platform (&quot;Platform&quot;) operated by BackOffice Pro (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Platform.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          The Platform provides enterprise-grade survey verification services powered by artificial intelligence and blockchain technology. Our services include survey creation, response verification, fraud detection, NFT certificate minting, and blockchain-based audit trails.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any unlawful purpose or in violation of any applicable regulations</li>
          <li>Attempt to gain unauthorized access to any portion of the Platform</li>
          <li>Interfere with or disrupt the Platform or servers</li>
          <li>Use automated systems to access the Platform without our express permission</li>
          <li>Submit false, misleading, or fraudulent survey data</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Platform and its original content, features, and functionality are owned by BackOffice Pro and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </p>

        <h2>6. Blockchain and NFT Terms</h2>
        <p>
          When you use blockchain features of the Platform, you acknowledge that blockchain transactions are irreversible and that you are responsible for all gas fees and transaction costs. NFT certificates minted through the Platform represent verification records and do not confer ownership rights beyond what is explicitly stated.
        </p>

        <h2>7. Data Protection</h2>
        <p>
          We process personal data in accordance with our Privacy Policy and applicable data protection laws including POPIA and GDPR. Survey data is encrypted at rest and in transit. Blockchain verification hashes do not contain personal data.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, BackOffice Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Platform immediately, without prior notice, for conduct that we determine, in our sole discretion, violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Platform after any modifications indicates your acceptance of the new Terms.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
          <br />
          BackOffice Pro (Pty) Ltd
          <br />
          Email: legal@backofficepro.com
          <br />
          Johannesburg, South Africa
        </p>
      </main>
    </div>
  )
}
