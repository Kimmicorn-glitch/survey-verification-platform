import type { Metadata } from "next"

const SITE_NAME = "Survey Verification Platform | BackOffice Pro"
const SITE_URL = "https://surveyplatform.backofficepro.com"
const DEFAULT_DESCRIPTION =
  "Enterprise-grade survey verification platform powered by AI and blockchain. Trust Every Survey. Verify Every Transaction."
const DEFAULT_IMAGE = "/og-image.png"

interface PageMetadataOptions {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  type?: "website" | "article"
}

export function generatePageMetadata({
  title,
  description,
  path = "",
  image,
  noIndex = false,
  type = "website",
}: PageMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | BackOffice Pro` : SITE_NAME
  const pageDescription = description || DEFAULT_DESCRIPTION
  const pageUrl = `${SITE_URL}${path}`
  const pageImage = image || DEFAULT_IMAGE

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      type,
      locale: "en_US",
      url: pageUrl,
      siteName: SITE_NAME,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title || "Survey Verification Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  }
}

export const PAGE_METADATA = {
  home: generatePageMetadata(),
  dashboard: generatePageMetadata({
    title: "Dashboard",
    path: "/dashboard",
  }),
  surveys: generatePageMetadata({
    title: "Surveys",
    description: "Manage and track all your surveys with blockchain verification.",
    path: "/surveys",
  }),
  analytics: generatePageMetadata({
    title: "Analytics",
    description:
      "Insights and performance metrics across all your surveys.",
    path: "/dashboard/analytics",
  }),
  verification: generatePageMetadata({
    title: "Verification",
    description:
      "AI-powered verification of survey responses with trust scoring.",
    path: "/verification",
  }),
  nfts: generatePageMetadata({
    title: "NFT Certificates",
    description:
      "Blockchain-backed NFT certificates for verified survey responses.",
    path: "/nfts",
  }),
  wallet: generatePageMetadata({
    title: "Wallet",
    description: "Manage your connected wallets and blockchain transactions.",
    path: "/wallet",
  }),
  admin: generatePageMetadata({
    title: "Admin Dashboard",
    description: "Platform administration and system management.",
    path: "/dashboard/admin",
  }),
  adminUsers: generatePageMetadata({
    title: "User Management",
    path: "/dashboard/admin/users",
  }),
  adminRoles: generatePageMetadata({
    title: "Role Management",
    path: "/dashboard/admin/roles",
  }),
  adminSettings: generatePageMetadata({
    title: "System Settings",
    path: "/dashboard/admin/settings",
  }),
  notifications: generatePageMetadata({
    title: "Notifications",
    path: "/dashboard/notifications",
  }),
  reports: generatePageMetadata({
    title: "Reports",
    path: "/dashboard/reports",
  }),
  login: generatePageMetadata({
    title: "Sign In",
    path: "/auth/login",
    noIndex: true,
  }),
  register: generatePageMetadata({
    title: "Create Account",
    path: "/auth/register",
    noIndex: true,
  }),
  terms: generatePageMetadata({
    title: "Terms of Service",
    path: "/legal/terms",
  }),
  privacy: generatePageMetadata({
    title: "Privacy Policy",
    path: "/legal/privacy",
  }),
  cookies: generatePageMetadata({
    title: "Cookie Policy",
    path: "/legal/cookies",
  }),
} as const
