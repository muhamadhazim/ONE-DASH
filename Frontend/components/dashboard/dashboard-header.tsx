"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, User, ExternalLink } from "lucide-react"

interface DashboardHeaderProps {
  user: { username?: string; email?: string } | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1a365d] mb-2">
        Welcome back{user?.username ? `, ${user.username}` : ""}! 👋
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base">
        Here's your OneDash overview
      </p>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
        <Link href="/link">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Edit Links
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Account Settings
          </Button>
        </Link>
        <Link href={user?.username ? `/u/${user.username}` : "#"}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View My Page
          </Button>
        </Link>
      </div>
    </div>
  )
}
