"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Link as LinkIcon } from "lucide-react"

interface LinkGeneratorProps {
  user: { username?: string; email?: string } | null
  origin: string
}

export function LinkGenerator({ user, origin }: LinkGeneratorProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

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

  return (
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
  )
}
