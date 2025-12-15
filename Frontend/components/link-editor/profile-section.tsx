import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Trash2 } from "lucide-react"
import { ProfileData, Message } from "./types"

interface ProfileSectionProps {
  profile: ProfileData
  username: string
  apiUrl: string
  onUpdate: (profile: ProfileData) => void
  onMessage: (message: Message) => void
}

export function ProfileSection({ profile, username, apiUrl, onUpdate, onMessage }: ProfileSectionProps) {
  return (
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
                  src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${apiUrl}${profile.avatar_url}`} 
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
                  const res = await fetch(`${apiUrl}/api/profile/avatar`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  })
                  
                  if (res.ok) {
                    const data = await res.json()
                    onUpdate({ ...profile, avatar_url: data.avatar_url })
                    onMessage({ type: "success", text: "Avatar uploaded!" })
                    setTimeout(() => onMessage({ type: "", text: "" }), 2000)
                  } else {
                    throw new Error("Upload failed")
                  }
                } catch (error) {
                  onMessage({ type: "error", text: "Failed to upload avatar" })
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
                  onClick={() => onUpdate({ ...profile, avatar_url: "" })}
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
                onClick={() => onUpdate({ ...profile, banner_url: "" })}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="relative h-32 rounded-xl bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#FF6B35] transition-colors group">
            {profile.banner_url ? (
              <img 
                src={profile.banner_url.startsWith('http') ? profile.banner_url : `${apiUrl}${profile.banner_url}`} 
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
                  const res = await fetch(`${apiUrl}/api/profile/banner`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  })
                  
                  if (res.ok) {
                    const data = await res.json()
                    onUpdate({ ...profile, banner_url: data.banner_url })
                    onMessage({ type: "success", text: "Banner uploaded!" })
                    setTimeout(() => onMessage({ type: "", text: "" }), 2000)
                  } else {
                    throw new Error("Upload failed")
                  }
                } catch (error) {
                  onMessage({ type: "error", text: "Failed to upload banner" })
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
            onChange={(e) => onUpdate({ ...profile, display_name: e.target.value })}
            placeholder="Your name"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
          <Input
            value={profile.location}
            onChange={(e) => onUpdate({ ...profile, location: e.target.value })}
            placeholder="Jakarta, Indonesia"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio</label>
          <Textarea
            value={profile.bio}
            onChange={(e) => onUpdate({ ...profile, bio: e.target.value })}
            placeholder="Tell your followers about yourself..."
            className="mt-1 min-h-[80px]"
          />
        </div>
      </div>
    </div>
  )
}
