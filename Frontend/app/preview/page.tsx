"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  MapPin,
  Share2,
  ExternalLink,
  Music,
  Eye,
  Smartphone,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PreviewPage() {
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile")

  // This would be from form state in real app
  const profile = {
    name: "Your Name",
    location: "Your Location",
    bio: "Your bio goes here. Tell your followers about yourself!",
    avatar: "/default-user-avatar.png",
    bannerColor: "#1a1a2e",
    socials: [
      { type: "instagram", url: "#" },
      { type: "youtube", url: "#" },
      { type: "tiktok", url: "#" },
      { type: "email", url: "#" },
    ],
    links: [
      { title: "My Website", subtitle: "Check it out", url: "#" },
      { title: "Latest Video", subtitle: "Watch now", url: "#" },
      { title: "Shop My Products", url: "#" },
    ],
  }

  const socialIcons: Record<string, React.ElementType> = {
    email: Mail,
    phone: Phone,
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    github: Github,
    telegram: Send,
    tiktok: Music,
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a365d]">Preview Your One Dash</h1>
            <p className="text-muted-foreground">This is how your profile looks to visitors</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
            <Button
              variant={viewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
              className={viewMode === "mobile" ? "bg-[#4A7DFF]" : ""}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
            <Button
              variant={viewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
              className={viewMode === "desktop" ? "bg-[#4A7DFF]" : ""}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex justify-center">
          <div
            className={`
              bg-gray-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500
              ${viewMode === "mobile" ? "w-[375px]" : "w-full max-w-2xl"}
            `}
          >
            {/* Phone Frame (mobile only) */}
            {viewMode === "mobile" && (
              <div className="h-6 bg-gray-800 flex items-center justify-center">
                <div className="w-20 h-4 bg-gray-900 rounded-full" />
              </div>
            )}

            {/* Profile Content */}
            <div className="min-h-[600px] bg-gradient-to-b from-gray-900 to-gray-800">
              {/* Banner */}
              <div className="h-32 relative overflow-hidden" style={{ backgroundColor: profile.bannerColor }}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80" />
                <button className="absolute top-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all">
                  <Share2 className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="px-4 -mt-10 relative z-10 pb-8">
                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-700">
                    <Image
                      src={profile.avatar || "/placeholder.svg"}
                      alt={profile.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name & Location */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold text-white mb-0.5">{profile.name}</h1>
                  <p className="text-gray-400 flex items-center justify-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </p>
                  <p className="text-gray-300 mt-2 text-sm max-w-xs mx-auto">{profile.bio}</p>
                </div>

                {/* Social Icons */}
                <div className="flex justify-center gap-2 mb-6">
                  {profile.socials.map((social, index) => {
                    const Icon = socialIcons[social.type] || ExternalLink
                    return (
                      <a
                        key={index}
                        href={social.url}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#4A7DFF] transition-all"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    )
                  })}
                </div>

                {/* Links */}
                <div className="space-y-2">
                  {profile.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      className="block w-full p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white text-sm">{link.title}</h3>
                          {link.subtitle && <p className="text-xs text-gray-400">{link.subtitle}</p>}
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-[#4A7DFF] transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                  <span className="text-gray-500 text-xs">
                    <span className="text-[#5DADE2] font-semibold">One</span>
                    <span className="text-gray-400 ml-1">Dash</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" asChild>
            <Link href="/link">Edit Links</Link>
          </Button>
          <Button className="bg-[#4A7DFF] hover:bg-[#3a6dee]" asChild>
            <Link href="/link">
              <Eye className="h-4 w-4 mr-2" />
              Edit Your Page
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
