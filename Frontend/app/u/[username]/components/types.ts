export type Product = {
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

export type Profile = {
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
