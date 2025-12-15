"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

interface DashboardStats {
  top_links: { link_id: string; title: string; clicks: number }[]
}

interface TopLinksProps {
  stats: DashboardStats | null
}

export function TopLinks({ stats }: TopLinksProps) {
  // Prepare top links data
  const topLinksData = stats?.top_links?.length
    ? stats.top_links.map(l => ({ name: l.title, clicks: l.clicks }))
    : []

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-6 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-[#1a365d]">
            Top Performing Links
          </CardTitle>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead>
              <tr>
                <th className="text-left text-xs sm:text-sm font-normal text-muted-foreground pb-2 sm:pb-3"></th>
                <th className="text-right text-xs sm:text-sm font-normal text-muted-foreground pb-2 sm:pb-3">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {topLinksData.length > 0 ? (
                topLinksData.map((item, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-2 sm:py-3 text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">
                      {item.name}
                    </td>
                    <td className="py-2 sm:py-3 text-xs sm:text-sm text-right text-muted-foreground">
                      {item.clicks.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                    No click data yet. Share your link!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
