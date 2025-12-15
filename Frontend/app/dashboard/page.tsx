"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { format, subDays } from "date-fns"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { LinkGenerator } from "@/components/dashboard/link-generator"
import { SocialStats } from "@/components/dashboard/social-stats"
import { TopLinks } from "@/components/dashboard/top-links"
import { TimelineAnalytics } from "@/components/dashboard/timeline-analytics"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface DashboardStats {
  overview: {
    total_views: number
    total_clicks: number
    cvr: number
  }
  top_links: { link_id: string; title: string; clicks: number }[]
  social_stats: { social_type: string; clicks: number }[]
  clicks_by_source: { source: string; count: number }[]
  clicks_by_platform: { source: string; count: number }[]
  clicks_by_category: { source: string; count: number }[]
  daily_clicks: { date: string; count: number }[]
  estimated_revenue?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{username?: string, email?: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  
  // Filter state
  const [sourceFilter, setSourceFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [fromDate, setFromDate] = useState<Date | undefined>(subDays(new Date(), 7)) // Default to 7 days ago
  const [toDate, setToDate] = useState<Date | undefined>(new Date())     // Default to today
  // Timeline chart state
  const [chartTimeGroup, setChartTimeGroup] = useState("daily")
  const [chartGroupBy, setChartGroupBy] = useState("source")
  const [timelineData, setTimelineData] = useState<{date: string; group: string; count: number}[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]) // For checkboxes
  const [showInsights, setShowInsights] = useState(false) // For interactive analysis
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // Fetch stats with current filter values
  const fetchStats = async (
    token: string, 
    source: string, 
    platform: string, 
    category: string, 
    from: Date | undefined, 
    to: Date | undefined
  ) => {
    const params = new URLSearchParams()
    if (source !== "all") params.set("source", source)
    if (platform !== "all") params.set("platform", platform)
    if (category !== "all") params.set("category", category)
    if (from) params.set("from", format(from, 'yyyy-MM-dd'))
    if (to) params.set("to", format(to, 'yyyy-MM-dd'))
    
    const url = `${API_URL}/api/analytics/dashboard${params.toString() ? `?${params}` : ""}`
    console.log("Fetching:", url) // Debug
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setStats(data)
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (!token) {
      router.push("/login")
      return
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        setUser({})
      }
    }

    fetchStats(token, sourceFilter, platformFilter, categoryFilter, fromDate, toDate)
      .finally(() => setLoading(false))
  }, [router])

  // Refetch when filters change
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetchStats(token, sourceFilter, platformFilter, categoryFilter, fromDate, toDate)
  }, [sourceFilter, platformFilter, categoryFilter, fromDate, toDate])

  // Fetch timeline chart data
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const params = new URLSearchParams()
    params.set("time_group", chartTimeGroup)
    params.set("group_by", chartGroupBy)
    if (fromDate) params.append("from", format(fromDate, 'yyyy-MM-dd'))
    if (toDate) params.append("to", format(toDate, 'yyyy-MM-dd'))
    
    // Add global filters to timeline request
    if (sourceFilter !== "all") params.append("source", sourceFilter)
    if (platformFilter !== "all") params.append("platform", platformFilter)
    if (categoryFilter !== "all") params.append("category", categoryFilter)

    fetch(`${API_URL}/api/analytics/timeline?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        const data = json.data || []
        setTimelineData(data)
        // Auto-select all new groups when data changes
        const newGroups = [...new Set(data.map((d: any) => d.group))] as string[]
        setSelectedSeries(newGroups)
      })
      .catch(err => console.error("Timeline fetch error:", err))
  }, [chartTimeGroup, chartGroupBy, sourceFilter, platformFilter, categoryFilter, fromDate, toDate, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#5DADE2] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <DashboardHeader user={user} />

        <AnalyticsOverview 
          stats={stats} 
          fromDate={fromDate} 
          toDate={toDate} 
        />

        <DashboardFilters 
          fromDate={fromDate}
          toDate={toDate}
          sourceFilter={sourceFilter}
          platformFilter={platformFilter}
          categoryFilter={categoryFilter}
          setFromDate={setFromDate}
          setToDate={setToDate}
          setSourceFilter={setSourceFilter}
          setPlatformFilter={setPlatformFilter}
          setCategoryFilter={setCategoryFilter}
          onReset={() => {
            setSourceFilter("all")
            setPlatformFilter("all")
            setCategoryFilter("all")
            setFromDate(subDays(new Date(), 7))
            setToDate(new Date())
            setChartTimeGroup("daily")
            setChartGroupBy("source")
          }}
        />

        <LinkGenerator user={user} origin={origin} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <SocialStats stats={stats} />
          <TopLinks stats={stats} />
        </div>

        <TimelineAnalytics 
          timelineData={timelineData}
          chartTimeGroup={chartTimeGroup}
          setChartTimeGroup={setChartTimeGroup}
          chartGroupBy={chartGroupBy}
          setChartGroupBy={setChartGroupBy}
          showInsights={showInsights}
          setShowInsights={setShowInsights}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
          sourceFilter={sourceFilter}
          platformFilter={platformFilter}
        />
      </main>
    </div>
  )
}
