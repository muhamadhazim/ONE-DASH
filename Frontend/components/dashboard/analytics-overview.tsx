"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

interface DashboardStats {
  overview: {
    total_views: number
    total_clicks: number
    cvr: number
  }
  estimated_revenue?: number
}

interface AnalyticsOverviewProps {
  stats: DashboardStats | null
  fromDate: Date | undefined
  toDate: Date | undefined
}

export function AnalyticsOverview({ stats, fromDate, toDate }: AnalyticsOverviewProps) {
  // Prepare analytics data
  const analyticsData = [
    { label: "Views", value: stats?.overview?.total_views?.toString() || "0", color: "#22c55e" },
    { label: "Clicks", value: stats?.overview?.total_clicks?.toString() || "0", color: "#3b82f6" },
    { label: "CVR", value: stats?.overview?.cvr ? `${stats.overview.cvr.toFixed(1)}%` : "0%", color: "#22c55e" },
    {
      label: "Est. Revenue",
      value: stats?.estimated_revenue
        ? `Rp ${Math.round(stats.estimated_revenue).toLocaleString('id-ID')}`
        : "Rp 0",
      color: "#f87171"
    },
  ]

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="text-center pb-2 px-3 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-semibold text-[#1a365d]">
          {fromDate && toDate
            ? `Analitik: ${format(fromDate, 'd MMM')} - ${format(toDate, 'd MMM yyyy')}`
            : 'Lifetime Analytics'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 justify-center">
          {analyticsData.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center gap-1.5 sm:gap-2 justify-center mb-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs sm:text-sm text-muted-foreground">{item.label}:</span>
              </div>
              <span className="text-base sm:text-lg font-semibold text-[#1a365d]">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
