"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HelpCircle, Zap, User, ExternalLink } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"

// Colors for line chart
const CHART_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface TimelineAnalyticsProps {
  timelineData: { date: string; group: string; count: number }[]
  chartTimeGroup: string
  setChartTimeGroup: (value: string) => void
  chartGroupBy: string
  setChartGroupBy: (value: string) => void
  showInsights: boolean
  setShowInsights: (value: boolean) => void
  selectedSeries: string[]
  setSelectedSeries: (value: string[]) => void
  sourceFilter: string
  platformFilter: string
}

export function TimelineAnalytics({
  timelineData,
  chartTimeGroup,
  setChartTimeGroup,
  chartGroupBy,
  setChartGroupBy,
  showInsights,
  setShowInsights,
  selectedSeries,
  setSelectedSeries,
  sourceFilter,
  platformFilter
}: TimelineAnalyticsProps) {
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
  )
}
