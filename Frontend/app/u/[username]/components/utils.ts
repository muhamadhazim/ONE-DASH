import type React from "react"
import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  Music,
  MessageCircle,
  Flame,
  TrendingUp,
  Sparkles,
  Gift,
} from "lucide-react"

export const getVisitorId = (): string => {
  if (typeof window === 'undefined') return ''
  let visitorId = localStorage.getItem('od_vid')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem('od_vid', visitorId)
  }
  return visitorId
}

export const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return ""
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)
}

export const formatSold = (sold?: number) => {
  if (sold === undefined || sold === null) return ""
  if (sold >= 1000000) return `${(sold / 1000000).toFixed(1)}M reviews`
  if (sold >= 1000) return `${(sold / 1000).toFixed(1)}K reviews`
  return `${sold} reviews`
}

export const socialIcons: Record<string, React.ElementType> = {
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

export const badgeConfig = {
  hot: { icon: Flame, text: "HOT", bg: "bg-red-500", textColor: "text-white" },
  bestseller: { icon: TrendingUp, text: "Best Seller", bg: "bg-orange-500", textColor: "text-white" },
  new: { icon: Sparkles, text: "NEW", bg: "bg-emerald-500", textColor: "text-white" },
  limited: { icon: Gift, text: "Limited", bg: "bg-purple-500", textColor: "text-white" },
}

// Marketplace logos and detection
export const marketplaceConfig: Record<string, { name: string; logo: string; bg: string; textColor: string }> = {
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
  tiktokshop: {
    name: "TikTok Shop",
    logo: "🎵",
    bg: "bg-black",
    textColor: "text-white",
  },
  blibli: {
    name: "Blibli",
    logo: "💙",
    bg: "bg-[#0095DA]",
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

export function detectMarketplace(url: string): string | null {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes("tiktok") || lowerUrl.includes("vt.tokopedia.com") || lowerUrl.includes("shop-id.tokopedia.com")) return "tiktokshop"
  if (lowerUrl.includes("shopee") || lowerUrl.includes("shp.ee")) return "shopee"
  if (lowerUrl.includes("tokopedia") || lowerUrl.includes("tokped")) return "tokopedia"
  if (lowerUrl.includes("lazada")) return "lazada"
  if (lowerUrl.includes("bukalapak")) return "bukalapak"
  if (lowerUrl.includes("blibli")) return "blibli"
  return null
}
