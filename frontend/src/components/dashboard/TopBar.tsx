"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  CreditCard,
} from "lucide-react"

interface TopBarProps {
  onMenuToggle: () => void
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  return (
    <header className="flex h-16 items-center justify-between border-b border-soft-grey/60 bg-white/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-slate" />
        </Button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
          <input
            type="text"
            placeholder="Search surveys, verifications..."
            aria-label="Search"
            className="h-9 w-80 rounded-lg border border-soft-grey bg-ghost-white pl-9 pr-4 text-sm text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/40 transition-all"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-soft-grey bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-grey">
            /
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-slate" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5 text-slate" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric-blue opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-electric-blue" />
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-electric-blue text-white text-xs font-bold">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-charcoal">Account</p>
                <p className="text-xs text-muted-grey">
                  Manage your account
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-charcoal/20 backdrop-blur-sm md:hidden">
          <div className="w-[calc(100%-2rem)] max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-grey" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                aria-label="Search"
                className="h-12 w-full rounded-xl border border-soft-grey bg-white pl-10 pr-4 text-base text-charcoal placeholder:text-muted-grey focus:outline-none focus:ring-2 focus:ring-electric-blue/20 shadow-elevation-3"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default TopBar
