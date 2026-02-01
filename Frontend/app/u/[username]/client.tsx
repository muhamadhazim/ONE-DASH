"use client"

import { useState, useEffect } from "react"
import { ShoppingBag } from "lucide-react"
import { getTheme } from "@/lib/themes"
import { Profile, Product } from "./components/types"
import { getVisitorId } from "./components/utils"
import ProfileHeader from "./components/ProfileHeader"
import SocialLinks from "./components/SocialLinks"
import ProductFilters from "./components/ProductFilters"
import ProductCard from "./components/ProductCard"
import Footer from "./components/Footer"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function PublicProfileClient({ profile }: { profile: Profile }) {
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [source, setSource] = useState("direct")
  const [visitorId, setVisitorId] = useState("")

  useEffect(() => {
    setMounted(true)
    
    // Get UTM source and visitor ID
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source') || 'direct'
    setSource(utmSource)
    const currentVisitorId = getVisitorId()
    setVisitorId(currentVisitorId)

    // Check if logged-in user is viewing their own profile
    const loggedInUser = localStorage.getItem('user')
    let isOwnProfile = false
    
    if (loggedInUser) {
      try {
        const userData: { username?: string } = JSON.parse(loggedInUser)
        // Don't track if viewing own profile
        isOwnProfile = userData.username === profile.username
      } catch {
        // Invalid user data, continue tracking
      }
    }

    // Track page view only if NOT viewing own profile
    // Backend will also deduplicate within 1 hour
    if (profile.userId && !isOwnProfile) {
      const trackData = {
        user_id: profile.userId,
        visitor_id: currentVisitorId,
        source: utmSource
      }
      const blob = new Blob([JSON.stringify(trackData)], { type: 'application/json' })
      navigator.sendBeacon?.(`${API_URL}/api/analytics/pageview`, blob)
    }
  }, [])

  // Track product click - non-blocking
  const trackProductClick = (link: Product) => {
    if (!profile.userId || !link.id) return
    const trackData = {
      link_id: link.id,
      user_id: profile.userId,
      visitor_id: visitorId,
      source: source,
      platform: link.platform || '',
      category: link.category || ''
    }
    const blob = new Blob([JSON.stringify(trackData)], { type: 'application/json' })
    navigator.sendBeacon?.(`${API_URL}/api/analytics/track`, blob)
  }

  // Track social click - non-blocking
  const trackSocialClick = (socialType: string) => {
    if (!profile.userId) return
    const trackData = {
      user_id: profile.userId,
      visitor_id: visitorId,
      source: source,
      social_type: socialType
    }
    const blob = new Blob([JSON.stringify(trackData)], { type: 'application/json' })
    navigator.sendBeacon?.(`${API_URL}/api/analytics/social`, blob)
  }

  const filteredLinks = profile.links.filter((link) => {
    const matchesCategory = activeCategory === "all" || link.category === activeCategory
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Get the theme configuration
  const theme = getTheme(profile.theme)

  return (
    <div 
      className={`min-h-screen pb-safe ${theme.pageBackground}`}
    >
      <ProfileHeader 
        profile={profile} 
        theme={theme} 
        mounted={mounted} 
        API_URL={API_URL} 
      />

      {/* Content - Responsive container */}
      <div className="max-w-lg mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
        <SocialLinks 
          profile={profile} 
          theme={theme} 
          mounted={mounted} 
          trackSocialClick={trackSocialClick} 
        />

        <div
          className={`flex justify-center mb-4 sm:mb-5 py-3 px-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 transition-all duration-500 delay-150 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1" style={{ color: theme.accent }}>
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-bold text-sm sm:text-base">{profile.links.length}</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Products</div>
          </div>
        </div>

        <ProductFilters 
          profile={profile}
          theme={theme}
          mounted={mounted}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredCount={filteredLinks.length}
        />

        <div className="space-y-2.5 sm:space-y-3">
          {filteredLinks.map((product, index) => (
            <ProductCard
              key={index}
              product={product}
              theme={theme}
              mounted={mounted}
              index={index}
              trackProductClick={trackProductClick}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredLinks.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
            <p className="text-gray-500 text-sm">Tidak ada produk ditemukan</p>
          </div>
        )}

        <Footer theme={theme} mounted={mounted} />
      </div>
    </div>
  )
}
