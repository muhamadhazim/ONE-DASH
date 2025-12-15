import React from "react"
import { ExternalLink } from "lucide-react"
import { Profile } from "./types"
import { socialIcons } from "./utils"

type SocialLinksProps = {
  profile: Profile
  theme: any
  mounted: boolean
  trackSocialClick: (type: string) => void
}

export default function SocialLinks({ profile, theme, mounted, trackSocialClick }: SocialLinksProps) {
  return (
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
  )
}
