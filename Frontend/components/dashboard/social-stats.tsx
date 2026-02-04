"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Colors for pie chart
const COLORS = [
  "#fbbf24",
  "#a3e635",
  "#fde047",
  "#86efac",
  "#fca5a5",
  "#93c5fd",
  "#c4b5fd",
];

interface DashboardStats {
  clicks_by_source: { source: string; count: number }[];
}

interface SocialStatsProps {
  stats: DashboardStats | null;
}

export function SocialStats({ stats }: SocialStatsProps) {
  // Prepare clicks by source data for pie chart
  const socialIconsData = stats?.clicks_by_source?.length
    ? stats.clicks_by_source.map((s, i) => ({
        name: s.source.charAt(0).toUpperCase() + s.source.slice(1),
        value: s.count,
        color: COLORS[i % COLORS.length],
      }))
    : [{ name: "No data", value: 1, color: "#e5e7eb" }];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 sm:px-6 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-[#1a365d]">
            Social Media Tracking
          </CardTitle>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="space-y-1.5 sm:space-y-2 w-full sm:w-auto">
            {socialIconsData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
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
                <span className="text-xs sm:text-sm text-muted-foreground">
                  No data
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
