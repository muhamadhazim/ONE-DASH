"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Calendar, Zap, User, Settings, ExternalLink, Copy, Check, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Colors for pie chart
const COLORS = ["#fbbf24", "#a3e635", "#fde047", "#86efac", "#fca5a5", "#93c5fd", "#c4b5fd"]

// Colors for line chart
const CHART_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

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
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // Link Generator Sources
  const linkGeneratorSources = [
    { name: "Instagram", id: "instagram", icon: "📸" },
    { name: "TikTok", id: "tiktok", icon: "🎵" },
    { name: "WhatsApp", id: "whatsapp", icon: "💬" },
    { name: "Facebook", id: "facebook", icon: "blue" },
    { name: "Twitter", id: "twitter", icon: "🐦" },
    { name: "YouTube", id: "youtube", icon: "▶️" },
  ]

  const copyLink = (sourceId: string) => {
    if (!user?.username) return
    // Construct URL: origin + /u/username + ?utm_source=sourceId
    const textToCopy = `${origin}/u/${user.username}?utm_source=${sourceId}`
    
    navigator.clipboard.writeText(textToCopy)
    setCopiedStates(prev => ({ ...prev, [sourceId]: true }))
    
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [sourceId]: false }))
    }, 2000)
  }

  // Get unique groups from timeline data
  const allGroups = [...new Set(timelineData.map(d => d.group))].sort()
  
  // Filter groups based on selection (if empty, show all - initial state)
  const visibleGroups = selectedSeries.length > 0 
    ? allGroups.filter(g => selectedSeries.includes(g))
    : allGroups

  // Transform timeline data for recharts (pivot by group)
  const transformedTimelineData = timelineData.reduce((acc: Record<string, any>[], item) => {
    const existing = acc.find(d => d.date === item.date)
    if (existing) {
      existing[item.group] = item.count
    } else {
      acc.push({ date: item.date, [item.group]: item.count })
    }
    return acc
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

  // Prepare clicks by source data for pie chart
  const socialIconsData = stats?.clicks_by_source?.length 
    ? stats.clicks_by_source.map((s, i) => ({
        name: s.source.charAt(0).toUpperCase() + s.source.slice(1),
        value: s.count,
        color: COLORS[i % COLORS.length]
      }))
    : [{ name: "No data", value: 1, color: "#e5e7eb" }]

  // Prepare top links data
  const topLinksData = stats?.top_links?.length
    ? stats.top_links.map(l => ({ name: l.title, clicks: l.clicks }))
    : []

  // Available filter options (per user spec)
  const sourceOptions = ["all", "whatsapp", "instagram", "twitter", "tiktok", "youtube", "facebook", "others"]
  const platformOptions = ["all", "shopee", "tokopedia", "lazada", "others"]
  const categoryOptions = ["all", ...(stats?.clicks_by_category?.map(c => c.source) || [])]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#5DADE2] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Calculate dynamic insights based on VISIBLE data
  const getDominantGroup = () => {
    if (timelineData.length === 0) return null
    
    // Filter data based on visible groups (checkboxes)
    // If selectedSeries is empty, it means ALL are visible
    const groupsToConsider = selectedSeries.length > 0 ? selectedSeries : allGroups
    
    const totals: Record<string, number> = {}
    
    timelineData.forEach(d => {
      if (groupsToConsider.includes(d.group)) {
        totals[d.group] = (totals[d.group] || 0) + d.count
      }
    })

    let maxGroup = ""
    let maxCount = -1

    Object.entries(totals).forEach(([group, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxGroup = group
      }
    })

    return maxGroup ? { group: maxGroup, count: maxCount } : null
  }

  const dominant = getDominantGroup()

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome Header */}
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

        {/* Analytics Card - Responsive */}
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

          {/* Filters Section */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-base font-semibold text-[#1a365d]">Filters</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Date From */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 px-3 text-sm",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Date To */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 px-3 text-sm",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Source Filter */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Source</label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">Tiktok</SelectItem>
                      <SelectItem value="whatsapp">Whatsapp</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="youtube">Youtube</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Platform Filter */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="tokopedia">Tokopedia</SelectItem>
                      <SelectItem value="lazada">Lazada</SelectItem>
                      <SelectItem value="tiktok_shop">Tiktok Shop</SelectItem>
                      <SelectItem value="blibli">Blibli</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Category Filter */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Beauty">Beauty</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSourceFilter("all")
                    setPlatformFilter("all")
                    setCategoryFilter("all")
                    setFromDate(subDays(new Date(), 7))
                    setToDate(new Date())
                    setChartTimeGroup("daily")
                    setChartGroupBy("source")
                  }}
                  className="text-xs h-8"
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Link Generator Card */}
        <Card className="mb-6 sm:mb-8 border-blue-100 shadow-sm">
          <CardHeader className="px-3 sm:px-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-[#1a365d]">
                  UTM Link Generator
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Gunakan link ini untuk melacak sumber trafik Anda secara akurat (Read-only)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {linkGeneratorSources.map((source) => {
                // Construct link only if user and origin are available
                const link = (user?.username && origin) 
                  ? `${origin}/u/${user.username}?utm_source=${source.id}`
                  : "Loading..."
                
                return (
                  <div key={source.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border shadow-sm text-lg">
                        {source.icon === "blue" ? "🔵" : source.icon}
                      </div>
                      <span className="font-medium text-sm text-slate-700">{source.name}</span>
                    </div>

                    {/* Input & Copy Button */}
                    <div className="flex flex-1 items-center gap-2 w-full">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          readOnly
                          value={link}
                          className="w-full h-9 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-500 focus:outline-none cursor-not-allowed select-all"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant={copiedStates[source.id] ? "default" : "outline"}
                        onClick={() => copyLink(source.id)}
                        disabled={!user?.username}
                        className={`h-9 w-9 p-0 shrink-0 ${copiedStates[source.id] ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                      >
                        {copiedStates[source.id] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Social Icons Chart */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-6 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-[#1a365d]">Social Icons</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <div className="space-y-1.5 sm:space-y-2 w-full sm:w-auto">
                  {socialIconsData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {item.name} {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={socialIconsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {socialIconsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {!stats?.clicks_by_source?.length && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">No data</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Links */}
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
        </div>

        {/* Advanced Timeline Chart */}
        <Card className="mb-6">
          <CardHeader className="px-3 sm:px-6 pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-[#1a365d]">Click Analytics</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Time Group Filter */}
                <div className="w-full sm:w-[120px]">
                  <Select value={chartTimeGroup} onValueChange={setChartTimeGroup}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Group By Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-md w-full sm:w-auto">
                  <button
                    onClick={() => setChartGroupBy("source")}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                      chartGroupBy === "source" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    By Source
                  </button>
                  <button
                    onClick={() => setChartGroupBy("platform")}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                      chartGroupBy === "platform" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    By Platform
                  </button>
                </div>
                
                {/* Analyze Button */}
                <Button 
                  size="sm" 
                  onClick={() => setShowInsights(!showInsights)}
                  className={`${showInsights ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-blue-600 hover:bg-blue-700"} transition-colors`}
                >
                  <Zap className={`h-3.5 w-3.5 mr-1.5 ${showInsights ? "fill-blue-700" : "fill-white"}`} />
                  {showInsights ? "Tutup Analisis" : "Analisis Chart"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {timelineData.length > 0 ? (
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transformedTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => {
                          if (chartTimeGroup === "monthly") {
                            const [year, month] = value.split("-")
                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                            return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
                          }
                          if (chartTimeGroup === "weekly") {
                            const [year, week] = value.split("-")
                            return `W${week} '${year.slice(2)}`
                          }
                          const date = new Date(value)
                          return `${date.getDate()}/${date.getMonth() + 1}`
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        labelFormatter={(value) => {
                          if (chartTimeGroup === "monthly") return `Bulan: ${value}`
                          if (chartTimeGroup === "weekly") return `Minggu: ${value}`
                          return new Date(value).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
                        }}
                      />
                      {visibleGroups.map((group, index) => (
                        <Line 
                          key={group}
                          type="monotone" 
                          dataKey={group}
                          name={group.charAt(0).toUpperCase() + group.slice(1)}
                          stroke={CHART_COLORS[allGroups.indexOf(group) % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS[allGroups.indexOf(group) % CHART_COLORS.length], strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Checkbox Filters */}
                <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-slate-100">
                  {allGroups.map((group, index) => (
                    <label 
                      key={group} 
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedSeries.includes(group)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSeries([...selectedSeries, group])
                          } else {
                            setSelectedSeries(selectedSeries.filter(g => g !== group))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-xs sm:text-sm capitalize select-none">{group}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {/* Interactive Smart Insights */}
                {showInsights && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-[#1a365d]">Hasil Analisis AI</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* 1. Dominant Insight */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-100 rounded-full">
                            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm text-blue-900">Dominasi Trafik</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-700">
                          {dominant ? (
                            <>
                              Dari data yang ditampilkan, <span className="font-bold capitalize">{dominant.group}</span> paling dominan dengan 
                              <span className="font-bold"> {dominant.count} klik</span>.
                            </>
                          ) : (
                            "Tidak ada data yang cukup untuk analisis."
                          )}
                        </p>
                      </div>

                      {/* 2. Trend Insight (Dynamic based on chart data) */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-green-100 rounded-full">
                            <Zap className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm text-green-900">Tren Performa</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-green-700">
                          Grafik menunjukkan aktivitas yang {timelineData.length > 5 ? "fluktuatif" : "stabil"}. 
                          {chartGroupBy === 'source' 
                            ? " Coba diversifikasi konten ke platform lain untuk menjaga kestabilan." 
                            : " Pastikan ketersediaan produk di semua marketplace."}
                        </p>
                      </div>

                      {/* 3. Actionable Tip */}
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-amber-100 rounded-full">
                            <User className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm text-amber-900">Saran Aksi</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-700">
                          {selectedSeries.length < 2 
                            ? "Coba bandingkan minimal 2 item (centang checkbox di atas) untuk melihat korelasi performa." 
                            : `Anda sedang membandingkan ${selectedSeries.length} ${chartGroupBy}. Perhatikan pola lonjakan yang bersamaan.`}
                        </p>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span> Kesimpulan & Rekomendasi
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {(() => {
                          if (timelineData.length === 0) return "Data tidak cukup untuk membuat kesimpulan."
                          
                          // 1. Calculate Totals & Percentages based on VISIBLE data
                          const groupsToConsider = selectedSeries.length > 0 ? selectedSeries : allGroups
                          const visibleData = timelineData.filter(d => groupsToConsider.includes(d.group))
                          
                          // Aggregate counts per group
                          const groupTotals: Record<string, number> = {}
                          let totalClicks = 0
                          
                          visibleData.forEach(d => {
                            groupTotals[d.group] = (groupTotals[d.group] || 0) + d.count
                            totalClicks += d.count
                          })

                          if (totalClicks === 0) return "Belum ada klik pada periode ini."

                          // Sort groups by count desc
                          const sortedGroups = Object.entries(groupTotals)
                            .map(([group, count]) => ({ group, count, percent: Math.round((count / totalClicks) * 100) }))
                            .sort((a, b) => b.count - a.count)

                          const top1 = sortedGroups[0]
                          const top2 = sortedGroups[1]

                          // 2. Build Context String
                          let context = "Secara keseluruhan, audiens Anda"
                          if (sourceFilter !== "all" && chartGroupBy === "platform") {
                            context = `Audiens dari <span class="font-bold capitalize">${sourceFilter}</span>`
                          } else if (platformFilter !== "all" && chartGroupBy === "source") {
                            context = `Pengunjung ke <span class="font-bold capitalize">${platformFilter}</span>`
                          }

                          // 3. Build Observation String
                          let observation = ""
                          if (chartGroupBy === "platform") {
                            observation = `lebih tertarik terhadap platform <span class="font-bold capitalize">${top1.group}</span> (${top1.percent}%)`
                            if (top2) observation += `, diikuti oleh <span class="font-bold capitalize">${top2.group}</span> (${top2.percent}%)`
                          } else {
                            // Group by source
                            observation = `paling banyak datang dari <span class="font-bold capitalize">${top1.group}</span> (${top1.percent}%)`
                            if (top2) observation += `, dan <span class="font-bold capitalize">${top2.group}</span> (${top2.percent}%)`
                          }

                          // 4. Build Recommendation String
                          let recommendation = ""
                          if (chartGroupBy === "platform") {
                            recommendation = `Rekomendasi Min-Dash: Perbanyak produk dari e-commerce <span class="font-bold capitalize">${top1.group}</span> agar potensi affiliate tersampaikan maksimal kepada audiens ini.`
                          } else {
                            recommendation = `Rekomendasi Min-Dash: Fokuskan strategi konten Anda di <span class="font-bold capitalize">${top1.group}</span> karena channel ini memiliki konversi trafik tertinggi.`
                          }

                          return (
                            <span dangerouslySetInnerHTML={{ __html: `${context} ${observation}.<br/><br/>${recommendation}` }} />
                          )
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No click data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

