import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PublicProfileClient from "./client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface ProfileData {
  user_id: string
  name: string
  username: string
  location: string
  bio: string
  avatar: string
  banner: string
  banner_color: string
  theme?: string
  background_image?: string
  is_verified: boolean
  socials: { type: string; url: string }[]
  links: {
    id: string
    title: string
    subtitle?: string
    url: string
    image?: string
    price?: number
    original_price?: number
    discount?: string
    badge?: string
    rating?: number
    sold?: number
    category?: string
    platform?: string
  }[]
  categories: string[]
  stats: {
    products: number
    purchased: string
    rating: number
  }
}

async function getProfile(username: string): Promise<ProfileData | null> {
  try {
    const res = await fetch(`${API_URL}/api/u/${username}`, {
      cache: "no-store",
    })
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return null
  }
}

// Demo profiles for fallback
const demoProfiles: Record<string, any> = {
  jerry: {
    name: "Jerry J.",
    location: "Los Angeles, CA",
    bio: "Tech & Fashion Enthusiast. Sharing my favorite products with exclusive discounts just for you!",
    avatar: "/young-man-with-blue-hair-smiling-professional-head.jpg",
    banner: "/colorful-gradient-abstract-background.jpg",
    bannerColor: "#FF6B35",
    categories: ["Tech", "Fashion", "Lifestyle"],
    socials: [
      { type: "instagram", url: "https://instagram.com" },
      { type: "youtube", url: "https://youtube.com" },
      { type: "tiktok", url: "https://tiktok.com" },
      { type: "whatsapp", url: "https://wa.me" },
    ],
    links: [
      {
        title: "Sony WH-1000XM5 Wireless Headphones",
        url: "https://shopee.co.id/sony-headphones-i.123.456",
        image: "/sony-headphones-premium-black.jpg",
        price: 4299000,
        originalPrice: 5999000,
        discount: "28%",
        badge: "bestseller",
        rating: 4.9,
        sold: 2500,
        category: "Tech",
      },
      {
        title: "Nike Air Jordan 1 Retro High OG",
        url: "https://www.tokopedia.com/nike-store/air-jordan-1",
        image: "/nike-air-jordan-sneakers.jpg",
        price: 2799000,
        originalPrice: 3500000,
        discount: "20%",
        badge: "hot",
        rating: 4.8,
        sold: 1800,
        category: "Fashion",
      },
    ],
  },
  demo: {
    name: "Demo User",
    location: "Jakarta, Indonesia",
    bio: "This is a demo profile. Create your own!",
    avatar: "",
    banner: "",
    bannerColor: "#5DADE2",
    categories: [],
    socials: [],
    links: [],
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username)
  
  if (profile) {
    return {
      title: `${profile.name || profile.username} | One Dash`,
      description: profile.bio || `Check out ${profile.username}'s links on OneDash`,
    }
  }
  
  const demoProfile = demoProfiles[username] || demoProfiles["demo"]
  return {
    title: `${demoProfile.name} | One Dash`,
    description: demoProfile.bio,
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  
  // Try to fetch from API first
  const apiProfile = await getProfile(username)
  
  if (apiProfile) {
    // Transform API response to match client component props
    const profile = {
      userId: apiProfile.user_id,
      name: apiProfile.name || apiProfile.username,
      location: apiProfile.location || "",
      bio: apiProfile.bio || "",
      avatar: apiProfile.avatar || "",
      banner: apiProfile.banner || "",
      bannerColor: apiProfile.banner_color || "#5DADE2",
      theme: apiProfile.theme || "sunset",
      backgroundImage: apiProfile.background_image || "",
      isVerified: apiProfile.is_verified || false,
      categories: apiProfile.categories || [],
      socials: apiProfile.socials || [],
      links: apiProfile.links.map(link => ({
        id: link.id,
        title: link.title,
        subtitle: link.subtitle,
        url: link.url,
        image: link.image,
        price: link.price,
        originalPrice: link.original_price,
        discount: link.discount,
        badge: link.badge as "hot" | "bestseller" | "new" | "limited" | undefined,
        rating: link.rating,
        sold: link.sold,
        category: link.category,
        platform: link.platform,
      })),
      stats: apiProfile.stats,
    }
    
    return <PublicProfileClient profile={profile} />
  }
  
  // Fallback to demo profiles
  const demoProfile = demoProfiles[username]
  if (!demoProfile && username !== "demo" && username !== "jerry") {
    // User not found in API or demo profiles
    notFound()
  }
  
  return <PublicProfileClient profile={demoProfile || demoProfiles["demo"]} />
}
