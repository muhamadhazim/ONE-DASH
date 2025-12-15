import { LucideIcon } from "lucide-react"
import { ThemeId } from "@/lib/themes"

export interface LinkItem {
  id?: string
  title: string
  subtitle: string
  url: string
  image?: string
  price?: number
  original_price?: number
  discount?: string
  category?: string
  rating?: number
  sold?: number
  platform?: string
}

export interface ContactItem {
  id?: string
  type: string
  url: string
}

export interface ProfileData {
  display_name: string
  location: string
  bio: string
  avatar_url: string
  banner_url: string
  banner_color: string
  theme: ThemeId
}

export interface Message {
  type: string
  text: string
}

export interface SocialOption {
  type: string
  icon: LucideIcon
  label: string
  color: string
}
