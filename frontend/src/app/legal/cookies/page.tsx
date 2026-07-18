import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Cookie Policy | BackOffice Pro",
}

export default function CookiesPage() {
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
        <h1>Cookie Policy</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2025</p>

        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>
          We use cookies to improve your experience on the Survey Verification Platform, remember your preferences, maintain your authenticated session, understand how you use the Platform, and enhance security.
        </p>

        <h2>3. Types of Cookies We Use</h2>

        <h3>3.1 Essential Cookies</h3>
        <p>
          These cookies are strictly necessary for the Platform to function. They enable core features such as authentication, security, and session management. You cannot opt out of these cookies as the Platform would not work without them.
        </p>
        <ul>
          <li><strong>session_id:</strong> Maintains your authenticated session (expires on logout)</li>
          <li><strong>csrf_token:</strong> Prevents cross-site request forgery attacks (session duration)</li>
          <li><strong>auth_token:</strong> JWT authentication token (as per token expiry settings)</li>
          <li><strong>cookie_consent:</strong> Stores your cookie preferences (1 year)</li>
        </ul>

        <h3>3.2 Analytics Cookies</h3>
        <p>
          These cookies help us understand how visitors interact with the Platform by collecting and reporting information anonymously. This helps us improve the Platform experience.
        </p>
        <ul>
          <li><strong>_ga:</strong> Google Analytics - distinguishes unique users (2 years)</li>
          <li><strong>_ga_*:</strong> Google Analytics - maintains session state (2 years)</li>
        </ul>

        <h3>3.3 Preference Cookies</h3>
        <p>
          These cookies allow the Platform to remember choices you make to improve your experience.
        </p>
        <ul>
          <li><strong>theme:</strong> Stores your dark/light mode preference (1 year)</li>
          <li><strong>language:</strong> Stores your language preference (1 year)</li>
          <li><strong>sidebar:</strong> Stores sidebar state (1 year)</li>
        </ul>

        <h2>4. Third-Party Cookies</h2>
        <p>
          Some cookies are placed by third-party services that appear on our pages. We use third-party services for analytics (Google Analytics), wallet connectivity (WalletConnect), and payment processing. These third parties may use cookies according to their own privacy policies.
        </p>

        <h2>5. Managing Cookies</h2>
        <p>
          You can control and manage cookies through your browser settings. Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites.
        </p>
        <p>Common browser cookie settings:</p>
        <ul>
          <li>Chrome: Settings &gt; Privacy and Security &gt; Cookies</li>
          <li>Firefox: Settings &gt; Privacy &amp; Security &gt; Cookies</li>
          <li>Safari: Preferences &gt; Privacy &gt; Cookies</li>
          <li>Edge: Settings &gt; Privacy &gt; Cookies</li>
        </ul>

        <h2>6. Impact of Disabling Cookies</h2>
        <p>
          If you disable or refuse cookies, some parts of the Platform may become inaccessible or not function properly. Session cookies, in particular, are essential for authentication and security.
        </p>

        <h2>7. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. Any changes will be posted on this page with an updated revision date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about our use of cookies, please contact:
          <br />
          BackOffice Pro (Pty) Ltd
          <br />
          Email: privacy@backofficepro.com
        </p>
      </main>
    </div>
  )
}
