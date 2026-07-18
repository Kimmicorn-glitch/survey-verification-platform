"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Image,
  Wallet,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  X,
  CreditCard,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Surveys", href: "/surveys", icon: ClipboardList },
      { label: "Verification", href: "/verification", icon: ShieldCheck, badge: "New" },
      { label: "NFT Collection", href: "/nfts", icon: Image },
      { label: "Wallet", href: "/wallet", icon: Wallet },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Team", href: "/dashboard/team", icon: Users },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help Center", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-soft-grey/60 bg-white",
          "transition-transform duration-300 ease-out",
          "lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-soft-grey/60 px-6">
          <Link href="/" className="flex items-center gap-2 group" aria-label="BackOffice Pro Home">
            <div className="relative">
              <Shield className="w-6 h-6 text-electric-blue transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 w-6 h-6 bg-electric-blue/10 rounded-full blur-md" />
            </div>
            <span className="text-base font-bold tracking-tight text-charcoal">
              BackOffice
              <span className="text-electric-blue"> Pro</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-ghost-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar" aria-label="Dashboard navigation">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-grey">
                {section.title}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-electric-blue shadow-sm shadow-electric-blue/5"
                          : "text-slate hover:bg-ghost-white hover:text-charcoal"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-electric-blue" : "text-muted-grey"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-electric-blue/10 px-2 py-0.5 text-[10px] font-semibold text-electric-blue">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Plan info */}
        <div className="border-t border-soft-grey/60 p-4">
          <div className="rounded-xl bg-ghost-white border border-soft-grey/50 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-electric-blue/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-electric-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal truncate">
                  Free Tier
                </p>
                <p className="text-[10px] text-muted-grey">
                  Upgrade for more features
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
