import React, { useState } from "react"
import Image from "next/image"
import { MapPin, Check, Share2, Verified } from "lucide-react"
import { Profile } from "./types"

type ProfileHeaderProps = {
  profile: Profile
  theme: any
  mounted: boolean
  API_URL: string
}

export default function ProfileHeader({ profile, theme, mounted, API_URL }: ProfileHeaderProps) {
  const [copiedLink, setCopiedLink] = useState(false)

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

  return (
    <>
      {/* Header Banner - Responsive height */}
      <div className="relative h-28 sm:h-32 md:h-40 overflow-hidden">
        {profile.banner ? (
          <Image
            src={profile.banner.startsWith('http') ? profile.banner : `${API_URL}${profile.banner}`}
            alt="Profile Banner"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div 
            className="absolute inset-0" 
            style={{ background: theme.background }} 
          />
        )}
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

      <div className="max-w-lg mx-auto px-3 sm:px-4">
        <div
          className={`flex flex-col items-center -mt-14 sm:-mt-16 mb-3 sm:mb-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative mb-2 sm:mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar.startsWith('http') ? profile.avatar : `${API_URL}${profile.avatar}`}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-cover"
                    priority
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
      </div>
    </>
  )
}
