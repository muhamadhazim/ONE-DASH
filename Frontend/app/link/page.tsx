"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, Trash2, ExternalLink, Loader2, Check, AlertCircle, Eye, Save, RefreshCw,
  Mail, Phone, Instagram, Youtube, Github, Send, Music, MapPin, Camera, Link2,
  Heart, Share2, Verified, ShoppingBag, Star, Palette
} from "lucide-react"
import { themes, themeList, getTheme, type ThemeId } from "@/lib/themes"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface LinkItem {
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

// ...

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



interface ContactItem {
  id?: string
  type: string
  url: string
}

const socialOptions = [
  { type: "instagram", icon: Instagram, label: "Instagram", color: "#E4405F" },
  { type: "youtube", icon: Youtube, label: "YouTube", color: "#FF0000" },
  { type: "tiktok", icon: Music, label: "TikTok", color: "#000000" },
  { type: "email", icon: Mail, label: "Email", color: "#EA4335" },
  { type: "whatsapp", icon: Phone, label: "WhatsApp", color: "#25D366" },
  { type: "github", icon: Github, label: "GitHub", color: "#181717" },
  { type: "telegram", icon: Send, label: "Telegram", color: "#0088cc" },
]

export default function LinkEditorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  const [profile, setProfile] = useState({
    display_name: "",
    location: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    banner_color: "#FF6B35",
    theme: "sunset" as ThemeId,

  })
  
  const [links, setLinks] = useState<LinkItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [username, setUsername] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (!token) {
      router.push("/login")
      return
    }

    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUsername(user.username || "")
      } catch {}
    }

    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const profileRes = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile({
          display_name: profileData.display_name || "",
          location: profileData.location || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || "",
          banner_url: profileData.banner_url || "",
          banner_color: profileData.banner_color || "#FF6B35",
          theme: profileData.theme || "sunset",

        })
      }

      const linksRes = await fetch(`${API_URL}/api/links`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (linksRes.ok) {
        const linksData = await linksRes.json()
        // Transform backend format to frontend format (image_url -> image)
        const transformedLinks = (linksData || []).map((link: any) => ({
          ...link,
          image: link.image_url || link.image,
        }))
        setLinks(transformedLinks)
      }

      const contactsRes = await fetch(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addLink = () => {
    setLinks([...links, { title: "", subtitle: "", url: "", category: "" }])
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    let processedValue: string | number = value
    if (field === 'rating' || field === 'price' || field === 'sold' || field === 'original_price') {
      processedValue = value ? parseFloat(value) : 0
    }
    setLinks(links.map((link, i) => (i === index ? { ...link, [field]: processedValue } : link)))
  }

  const scrapeLink = async (index: number) => {
    const link = links[index]
    if (!link.url) {
      setMessage({ type: "error", text: "Please enter a URL first" })
      return
    }

    setScrapingIndex(index)
    setMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/links/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: link.url }),
      })

      if (!response.ok) {
        throw new Error("Failed to scrape URL")
      }

      const data = await response.json()
      console.log("Scraped data:", data) // Debug log
      
      // Update link with scraped data
      setLinks(links.map((l, i) => {
        if (i === index) {
          return {
            ...l,
            title: data.title || l.title,
            image: data.image_url || data.image || l.image,
            price: data.price || l.price,
            original_price: data.original_price || l.original_price,
            discount: data.discount || l.discount,
            category: data.category || l.category,
            rating: data.rating || l.rating,
            sold: data.sold || l.sold,
            platform: data.platform || l.platform,
          }
        }
        return l
      }))

      setMessage({ type: "success", text: "Product data fetched!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Could not fetch product data" })
    } finally {
      setScrapingIndex(null)
    }
  }

  const toggleContact = (type: string) => {
    const existing = contacts.find(c => c.type === type)
    if (existing) {
      setContacts(contacts.filter(c => c.type !== type))
    } else {
      setContacts([...contacts, { type, url: "" }])
    }
  }

  const updateContact = (type: string, url: string) => {
    setContacts(contacts.map(c => (c.type === type ? { ...c, url } : c)))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      
      await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      })

      const existingLinksRes = await fetch(`${API_URL}/api/links`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const existingLinks = await existingLinksRes.json()
      
      for (const link of existingLinks || []) {
        await fetch(`${API_URL}/api/links/${link.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      for (const link of links) {
        if (link.title && link.url) {
          // Transform to backend format
          const linkData = {
            title: link.title,
            subtitle: link.subtitle,
            url: link.url,
            image_url: link.image, // Frontend uses 'image', backend uses 'image_url'
            price: link.price,
            original_price: link.original_price,
            discount: link.discount,
            category: link.category,
            rating: link.rating || 0,
            sold: link.sold || 0,
            platform: link.platform || "",
          }
          const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(linkData),
          })
          if (!res.ok) {
            const errData = await res.json()
            console.error("Failed to create link:", errData)
            throw new Error(errData.error || "Failed to create link")
          }
        }
      }

      const existingContactsRes = await fetch(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const existingContacts = await existingContactsRes.json()

      for (const contact of existingContacts || []) {
        await fetch(`${API_URL}/api/contacts/${contact.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      for (const contact of contacts) {
        if (contact.url) {
          await fetch(`${API_URL}/api/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(contact),
          })
        }
      }

      // Update localStorage with new avatar
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          userData.avatar_url = profile.avatar_url
          localStorage.setItem("user", JSON.stringify(userData))
        } catch (e) {
          console.error("Failed to update localStorage", e)
        }
      }

      setMessage({ type: "success", text: "Saved successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  // Get theme for live preview
  const previewTheme = getTheme(profile.theme)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Editor Panel */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Your Page</h1>
                <p className="text-gray-500 text-sm">Customize your profile and add affiliate links</p>
              </div>
              <div className="flex gap-2">
                <Link href={username ? `/u/${username}` : "#"} target="_blank">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </Link>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={saving}
                  className="gap-2 bg-[#FF6B35] hover:bg-[#E85A2A]"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {message.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="h-4 w-4 text-[#FF6B35]" />
                Profile
              </h2>
              
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${API_URL}${profile.avatar_url}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">
                          {(profile.display_name || username || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#FF6B35] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#E85A2A] transition-colors shadow-lg z-10"
                    >
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const formData = new FormData()
                        formData.append('avatar', file)
                        
                        try {
                          const token = localStorage.getItem("token")
                          const res = await fetch(`${API_URL}/api/profile/avatar`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                          })
                          
                          if (res.ok) {
                            const data = await res.json()
                            setProfile({ ...profile, avatar_url: data.avatar_url })
                            setMessage({ type: "success", text: "Avatar uploaded!" })
                            setTimeout(() => setMessage({ type: "", text: "" }), 2000)
                          } else {
                            throw new Error("Upload failed")
                          }
                        } catch (error) {
                          setMessage({ type: "error", text: "Failed to upload avatar" })
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                        <p className="text-xs text-gray-500">Recommended: 500x500px</p>
                      </div>
                      {profile.avatar_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProfile({ ...profile, avatar_url: "" })}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Banner Image</label>
                    {profile.banner_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProfile({ ...profile, banner_url: "" })}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="relative h-32 rounded-xl bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#FF6B35] transition-colors group">
                    {profile.banner_url ? (
                      <img 
                        src={profile.banner_url.startsWith('http') ? profile.banner_url : `${API_URL}${profile.banner_url}`} 
                        alt="Banner" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Camera className="h-8 w-8 mb-2" />
                        <span className="text-xs">Upload Banner</span>
                      </div>
                    )}
                    
                    <label 
                      htmlFor="banner-upload" 
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 cursor-pointer transition-colors"
                    >
                      <div className="bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <Camera className="h-4 w-4 text-gray-700" />
                      </div>
                    </label>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const formData = new FormData()
                        formData.append('banner', file)
                        
                        try {
                          const token = localStorage.getItem("token")
                          const res = await fetch(`${API_URL}/api/profile/banner`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                          })
                          
                          if (res.ok) {
                            const data = await res.json()
                            setProfile({ ...profile, banner_url: data.banner_url })
                            setMessage({ type: "success", text: "Banner uploaded!" })
                            setTimeout(() => setMessage({ type: "", text: "" }), 2000)
                          } else {
                            throw new Error("Upload failed")
                          }
                        } catch (error) {
                          setMessage({ type: "error", text: "Failed to upload banner" })
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 1500x500px</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Display Name</label>
                  <Input
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Jakarta, Indonesia"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio</label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell your followers about yourself..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Theme Selector Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#FF6B35]" />
                Page Theme
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {themeList.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setProfile({ ...profile, theme: theme.id })}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      profile.theme === theme.id 
                        ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Theme Preview */}
                    <div 
                      className="w-full h-12 rounded-lg mb-2"
                      style={{ background: theme.background }}
                    />
                    <div className="text-center">
                      <span className="text-lg">{theme.emoji}</span>
                      <p className="text-xs font-medium text-gray-700 mt-1 truncate">{theme.name}</p>
                    </div>
                    {profile.theme === theme.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-3 mb-4">
                Theme will be applied to your public profile page
              </p>
            </div>



            {/* Social Links Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#FF6B35]" />
                Social Links
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {socialOptions.map((social) => {
                  const isActive = contacts.some(c => c.type === social.type)
                  return (
                    <button
                      key={social.type}
                      onClick={() => toggleContact(social.type)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                        isActive 
                          ? "bg-[#FF6B35] text-white" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <social.icon className="h-4 w-4" />
                      {social.label}
                    </button>
                  )
                })}
              </div>

              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map((contact) => {
                    const social = socialOptions.find(s => s.type === contact.type)
                    return (
                      <div key={contact.type} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {social && <social.icon className="h-4 w-4 text-gray-600" />}
                        </div>
                        <Input
                          value={contact.url}
                          onChange={(e) => updateContact(contact.type, e.target.value)}
                          placeholder={`${social?.label} URL or username`}
                          className="flex-1"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Product Links Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#FF6B35]" />
                Product Links
              </h2>
              
              <div className="space-y-4">
                {links.map((link, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-3">
                      {/* Product Image Preview */}
                      <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {link.image ? (
                          <img src={link.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={link.title}
                          onChange={(e) => updateLink(index, "title", e.target.value)}
                          placeholder="Product name"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={link.url}
                            onChange={(e) => updateLink(index, "url", e.target.value)}
                            placeholder="https://shopee.co.id/product..."
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => scrapeLink(index)}
                            disabled={scrapingIndex === index}
                            className="shrink-0 gap-1"
                            title="Fetch product data from URL"
                          >
                            {scrapingIndex === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={link.price || ""}
                            onChange={(e) => updateLink(index, "price", e.target.value)}
                            placeholder="Rp 100.000"
                          />
                          <Input
                            value={link.category || ""}
                            onChange={(e) => updateLink(index, "category", e.target.value)}
                            placeholder="Category"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="5"
                            value={link.rating || ""}
                            onChange={(e) => updateLink(index, "rating", e.target.value)}
                            placeholder="Rating (0-5)"
                          />
                          <Input
                            value={link.sold || ""}
                            onChange={(e) => updateLink(index, "sold", e.target.value)}
                            placeholder="Sold/Reviews"
                          />
                          <div className="flex items-center">
                            {link.platform && (
                              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full capitalize">
                                {link.platform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addLink}
                  className="w-full border-dashed gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Product Link
                </Button>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:w-[380px] lg:sticky lg:top-20 lg:self-start">
            <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              {/* Phone notch */}
              <div className="h-6 bg-black flex items-center justify-center">
                <div className="w-20 h-4 bg-gray-800 rounded-full" />
              </div>
              
              {/* Preview content */}
              <div className={`min-h-[550px] overflow-y-auto max-h-[600px] ${previewTheme.pageBackground}`}>
                {/* Banner with pattern overlay */}
                <div 
                  className="h-28 relative bg-cover bg-center"
                  style={{ 
                    background: profile.banner_url 
                      ? `url(${profile.banner_url.startsWith('http') ? profile.banner_url : `${API_URL}${profile.banner_url}`})` 
                      : previewTheme.background 
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

                  <div className="absolute top-2 left-2 right-2 flex justify-between z-10">

                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs">
                      <Share2 className="h-3 w-3" />
                      Share
                    </div>
                  </div>
                </div>

                {/* Profile */}
                <div className="px-4 -mt-12 relative z-10">
                  <div className="flex flex-col items-center mb-3">
                    <div className="w-20 h-20 rounded-full p-0.5 bg-white shadow-xl mb-2">
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold overflow-hidden">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${API_URL}${profile.avatar_url}`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          (profile.display_name || username || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="absolute top-16 right-1/2 translate-x-8">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                        style={{ backgroundColor: previewTheme.accent }}
                      >
                        <Verified className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">{profile.display_name || username || "Your Name"}</h3>
                    {profile.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.location}
                      </p>
                    )}
                  </div>

                  {/* Stats Card */}
                  <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-3">
                    <div className="flex items-center justify-center gap-2" style={{ color: previewTheme.accent }}>
                      <ShoppingBag className="h-4 w-4" />
                      <span className="font-bold">{links.length}</span>
                      <span className="text-gray-500 text-sm">Products</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-400 flex items-center">
                      Cari produk...
                    </div>
                  </div>

                  {/* Rekomendasi Produk Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${previewTheme.accent}1A` }}
                      >
                        <ShoppingBag className="h-3 w-3" style={{ color: previewTheme.accent }} />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">Rekomendasi Produk</span>
                    </div>
                    <span className="text-xs" style={{ color: previewTheme.accent }}>{links.length} items</span>
                  </div>

                  {/* Links preview */}
                  <div className="space-y-2 pb-4">
                    {links.length > 0 ? (
                      links.slice(0, 3).map((link, index) => (
                        <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {link.image ? (
                                <Image src={link.image} alt="" width={56} height={56} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="h-6 w-6 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{link.title || "Product Name"}</p>
                              {/* Rating and Sold */}
                              {(link.rating || link.sold) && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                  {link.rating && link.rating > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                      <span>{link.rating.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {link.sold && <span>• {formatSold(link.sold)}</span>}
                                </div>
                              )}
                              {link.price && (
                                <p className="text-sm font-bold" style={{ color: previewTheme.accent }}>{formatPrice(link.price)}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {link.category && (
                                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{link.category}</span>
                                )}
                                {link.platform && (
                                  <span className="text-[10px] px-2 py-0.5 bg-orange-100 rounded-full text-orange-600 capitalize">{link.platform}</span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                          <ShoppingBag className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm">Tidak ada produk ditemukan</p>
                      </div>
                    )}
                    {links.length > 3 && (
                      <p className="text-center text-xs text-gray-400">+{links.length - 3} more products</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">Live Preview</p>
          </div>
        </div>
      </div>
    </div>
  )
}
