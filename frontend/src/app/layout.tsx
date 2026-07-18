import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Survey Verification Platform | BackOffice Pro",
  description:
    "Enterprise survey verification platform powered by AI and blockchain. Trust Every Survey. Verify Every Transaction.",
  keywords: [
    "survey verification",
    "blockchain verification",
    "NFT certificates",
    "AI fraud detection",
    "enterprise survey platform",
    "BackOffice Pro",
  ],
  authors: [{ name: "BackOffice Pro (Pty) Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://surveyplatform.backofficepro.com",
    siteName: "Survey Verification Platform",
    title: "Survey Verification Platform | BackOffice Pro",
    description:
      "Enterprise survey verification powered by AI and blockchain.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Survey Verification Platform | BackOffice Pro",
    description:
      "Enterprise survey verification powered by AI and blockchain.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-electric-blue focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
