"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Loader2 } from "lucide-react"
import { ThemeId } from "@/lib/themes"
import { HeaderSection } from "@/components/link-editor/header-section"
import { ProfileSection } from "@/components/link-editor/profile-section"
import { ThemeSection } from "@/components/link-editor/theme-section"
import { SocialLinksSection } from "@/components/link-editor/social-links-section"
import { ProductLinksSection } from "@/components/link-editor/product-links-section"
import { PreviewPanel } from "@/components/link-editor/preview-panel"
import { LinkItem, ContactItem, ProfileData } from "@/components/link-editor/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function LinkEditorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  const [profile, setProfile] = useState<ProfileData>({
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Editor Panel */}
          <div className="flex-1 space-y-6">
            <HeaderSection 
              username={username}
              saving={saving}
              message={message}
              onSave={handleSaveAll}
            />

            <ProfileSection 
              profile={profile}
              username={username}
              apiUrl={API_URL}
              onUpdate={setProfile}
              onMessage={setMessage}
            />

            <ThemeSection 
              profile={profile}
              onUpdate={setProfile}
            />

            <SocialLinksSection 
              contacts={contacts}
              setContacts={setContacts}
            />

            <ProductLinksSection 
              links={links}
              setLinks={setLinks}
              onMessage={setMessage}
              apiUrl={API_URL}
            />
          </div>

          {/* Live Preview Panel */}
          <PreviewPanel 
            profile={profile}
            username={username}
            links={links}
            apiUrl={API_URL}
          />
        </div>
      </div>
    </div>
  )
}
