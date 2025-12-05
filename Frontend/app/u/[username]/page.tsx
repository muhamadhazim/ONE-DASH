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
  
  return {
    title: "User Not Found | One Dash",
    description: "This profile does not exist.",
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  
  // Fetch from API
  const apiProfile = await getProfile(username)
  
  if (!apiProfile) {
    notFound()
  }
  
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

