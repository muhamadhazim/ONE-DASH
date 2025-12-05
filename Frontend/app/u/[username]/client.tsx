"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  MapPin,
  ExternalLink,
  Music,
  MessageCircle,
  Heart,
  Share2,
  Check,
  ShoppingBag,
  Star,
  Flame,
  Sparkles,
  ChevronRight,
  Verified,
  TrendingUp,
  Package,
  Gift,
  Percent,
  Search,
} from "lucide-react"
import { getTheme } from "@/lib/themes"

type Product = {
  id?: string
  title: string
  subtitle?: string
  url: string
  image?: string
  price?: number
  originalPrice?: number
  discount?: string
  badge?: "hot" | "bestseller" | "new" | "limited"
  rating?: number
  sold?: number
  category?: string
  platform?: string
}

type Profile = {
  userId?: string
  name: string
  location: string
  bio: string
  avatar: string
  banner: string
  bannerColor: string
  theme?: string

  isVerified?: boolean
  socials: { type: string; url: string; id?: string }[]
  links: Product[]
  categories?: string[]
  stats?: {
    products: number
    purchased: string
    rating: number
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Get or create visitor ID
const getVisitorId = (): string => {
  if (typeof window === 'undefined') return ''
  let visitorId = localStorage.getItem('od_vid')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem('od_vid', visitorId)
  }
  return visitorId
}

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return ""
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)
}

const formatSold = (sold?: number) => {
  if (sold === undefined || sold === null) return ""
  if (sold >= 1000000) return `${(sold / 1000000).toFixed(1)}M reviews`
  if (sold >= 1000) return `${(sold / 1000).toFixed(1)}K reviews`
  return `${sold} reviews`
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
  discord: MessageCircle,
  whatsapp: Phone,
}

const badgeConfig = {
  hot: { icon: Flame, text: "HOT", bg: "bg-red-500", textColor: "text-white" },
  bestseller: { icon: TrendingUp, text: "Best Seller", bg: "bg-orange-500", textColor: "text-white" },
  new: { icon: Sparkles, text: "NEW", bg: "bg-emerald-500", textColor: "text-white" },
  limited: { icon: Gift, text: "Limited", bg: "bg-purple-500", textColor: "text-white" },
}

// Marketplace logos and detection
const marketplaceConfig: Record<string, { name: string; logo: string; bg: string; textColor: string }> = {
  shopee: {
    name: "Shopee",
    logo: "🛒",
    bg: "bg-[#EE4D2D]",
    textColor: "text-white",
  },
  tokopedia: {
    name: "Tokopedia",
    logo: "🟢",
    bg: "bg-[#03AC0E]",
    textColor: "text-white",
  },
  tiktok: {
    name: "TikTok",
    logo: "🎵",
    bg: "bg-black",
    textColor: "text-white",
  },
  lazada: {
    name: "Lazada",
    logo: "💜",
    bg: "bg-[#0F146D]",
    textColor: "text-white",
  },
  bukalapak: {
    name: "Bukalapak",
    logo: "🔴",
    bg: "bg-[#E31E52]",
    textColor: "text-white",
  },
}

function detectMarketplace(url: string): string | null {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes("shopee") || lowerUrl.includes("shp.ee")) return "shopee"
  if (lowerUrl.includes("tokopedia") || lowerUrl.includes("tokped")) return "tokopedia"
  if (lowerUrl.includes("tiktok")) return "tiktok"
  if (lowerUrl.includes("lazada")) return "lazada"
  if (lowerUrl.includes("bukalapak")) return "bukalapak"
  return null
}

export default function PublicProfileClient({ profile }: { profile: Profile }) {
  const [copiedLink, setCopiedLink] = useState(false)
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
    setVisitorId(getVisitorId())

    // Track page view (async, non-blocking)
    if (profile.userId) {
      const trackData = {
        user_id: profile.userId,
        visitor_id: getVisitorId(),
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

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: profile.name, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }



  const filteredLinks = profile.links.filter((link) => {
    const matchesCategory = activeCategory === "all" || link.category === activeCategory
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["all", ...(profile.categories || [])]

  // Get the theme configuration
  const theme = getTheme(profile.theme)

  return (
    <div 
      className={`min-h-screen pb-safe ${theme.pageBackground}`}
    >
      {/* Header Banner - Responsive height */}
      <div
        className="relative h-28 sm:h-32 md:h-40 bg-cover bg-center"
        style={{
          background: profile.banner 
            ? `url(${profile.banner.startsWith('http') ? profile.banner : `${API_URL}${profile.banner}`})` 
            : theme.background,
        }}
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-end items-center z-10">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-all duration-300 min-h-[44px] sm:min-h-0"
          >
            {copiedLink ? <Check className="h-5 w-5 sm:h-4 sm:w-4" /> : <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />}
            <span className="text-sm font-medium">{copiedLink ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Content - Responsive container */}
      <div className="max-w-lg mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
        <div
          className={`flex flex-col items-center -mt-14 sm:-mt-16 mb-3 sm:mb-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative mb-2 sm:mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                {profile.avatar ? (
                  <img
                    src={profile.avatar.startsWith('http') ? profile.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${profile.avatar}`}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                    {(profile.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div 
              className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 sm:border-3 border-white shadow-md"
              style={{ backgroundColor: theme.accent }}
            >
              <Verified className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">{profile.name}</h1>
          <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1.5 sm:mb-2">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>{profile.location}</span>
          </div>

          <p className="text-gray-600 text-center text-xs sm:text-sm max-w-xs leading-relaxed px-2">{profile.bio}</p>
        </div>

        <div
          className={`flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1 scrollbar-hide transition-all duration-500 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {profile.socials.map((social, index) => {
            const Icon = socialIcons[social.type] || ExternalLink
            return (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick(social.type)}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all duration-300 shrink-0"
                style={{ '--hover-bg': theme.accent } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.accent
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
              </a>
            )
          })}
        </div>

        <div
          className={`flex justify-center mb-4 sm:mb-5 py-3 px-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 transition-all duration-500 delay-150 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1" style={{ color: theme.accent }}>
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-bold text-sm sm:text-base">{profile.links.length}</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">Products</div>
          </div>
        </div>

        <div
          className={`relative mb-3 sm:mb-4 transition-all duration-500 delay-175 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 sm:h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none transition-all"
            style={{ 
              caretColor: theme.accent,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent
              e.target.style.boxShadow = `0 0 0 2px ${theme.accent}33`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = ''
              e.target.style.boxShadow = ''
            }}
          />
        </div>

        <div
          className={`flex items-center justify-between mb-2 sm:mb-3 transition-all duration-500 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
            <h2 className={`font-bold text-sm sm:text-base ${theme.textPrimary}`}>Rekomendasi Produk</h2>
          </div>
          <span 
            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ 
              backgroundColor: `${theme.accent}1A`, // 10% opacity
              color: theme.accent 
            }}
          >
            {filteredLinks.length} items
          </span>
        </div>

        {profile.categories && profile.categories.length > 0 && (
          <div
            className={`flex gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory transition-all duration-500 delay-250 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 snap-start min-h-[40px] sm:min-h-0 ${
                  activeCategory === cat
                    ? "text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                }`}
                style={activeCategory === cat ? { backgroundColor: theme.accent } : {}}
              >
                {cat === "all" ? "Semua" : cat}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2.5 sm:space-y-3">
          {filteredLinks.map((product, index) => (
            <a
              key={index}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProductClick(product)}
              className={`group block transition-all duration-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${300 + index * 75}ms` }}
            >
              <div 
                className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.accent + '4D' // 30% opacity
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                }}
              >
                {/* Marketplace Badge - Top Right Corner of Card */}
                {(() => {
                  const marketplace = detectMarketplace(product.url)
                  if (marketplace && marketplaceConfig[marketplace]) {
                    const config = marketplaceConfig[marketplace]
                    return (
                      <div
                        className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} ${config.textColor} text-[10px] sm:text-xs font-semibold shadow-md`}
                      >
                        <span>{config.logo}</span>
                        <span>{config.name}</span>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                      </div>
                    )}

                    {/* Discount Badge - Bottom of Image */}
                    {product.discount && (
                      <div className="absolute bottom-1 left-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                        -{product.discount}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 
                        className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight mb-1 line-clamp-2 transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                      >
                        {product.title}
                      </h3>
                      {/* Rating and Sold */}
                      {(product.rating || product.sold) && (
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-1">
                          {product.rating && product.rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{product.rating.toFixed(2)}</span>
                            </div>
                          )}
                          {product.sold && (
                            <span className="text-gray-400">• {formatSold(product.sold)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        {product.price ? (
                          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-bold" style={{ color: theme.accent }}>{formatPrice(product.price)}</span>
                            {product.originalPrice && product.originalPrice > 0 && (
                              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-500">{product.subtitle || "Lihat detail"}</span>
                        )}
                      </div>

                      <div 
                        className="flex items-center gap-1 text-white px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold shadow-md group-hover:brightness-90 active:brightness-75 transition-all shrink-0"
                        style={{ backgroundColor: theme.accent }}
                      >
                        <span>Beli</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Banner - if discount exists */}
                {product.discount && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 sm:px-3 py-1.5 sm:py-2 border-t border-green-100">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-green-700">
                      <Percent className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium truncate">
                        Hemat hingga {product.discount} dengan link ini!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* Empty State */}
        {filteredLinks.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
            <p className="text-gray-500 text-sm">Tidak ada produk ditemukan</p>
          </div>
        )}

        <div
          className={`mt-5 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-500 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ 
            background: `linear-gradient(to right, ${theme.accent}0D, ${theme.accent}1A)`, // 5% to 10% opacity
            borderColor: `${theme.accent}33` // 20% opacity
          }}
        >
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${theme.accent}1A` }}
            >
              <Verified className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
            </div>
            <div className="min-w-0">
              <h4 
                className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1"
                style={{ color: theme.accent }}
              >
                Trusted Affiliate Partner
              </h4>
              <p className={`text-[10px] sm:text-xs leading-relaxed ${theme.textSecondary}`}>
                Semua link produk sudah diverifikasi dan aman. Dapatkan harga terbaik langsung dari seller terpercaya.
              </p>
            </div>
          </div>
        </div>
        <div
          className={`mt-6 sm:mt-8 text-center transition-all duration-500 delay-600 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-4 py-2.5 sm:py-2 rounded-full bg-white border border-gray-200 hover:shadow-md active:scale-95 transition-all duration-300"
            style={{ borderColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
          >
            <span className="text-[#5DADE2] font-bold">One</span>
            <span className="text-gray-600 font-medium">Dash</span>
          </Link>
          <p className="text-gray-400 text-[10px] sm:text-xs mt-2">Buat link affiliate gratis kamu</p>
        </div>
      </div>
    </div>
  )
}
