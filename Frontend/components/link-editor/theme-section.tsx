import { Palette, Check } from "lucide-react"
import { themeList, ThemeId } from "@/lib/themes"
import { ProfileData } from "./types"

interface ThemeSectionProps {
  profile: ProfileData
  onUpdate: (profile: ProfileData) => void
}

export function ThemeSection({ profile, onUpdate }: ThemeSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Palette className="h-4 w-4 text-[#FF6B35]" />
        Page Theme
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {themeList.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onUpdate({ ...profile, theme: theme.id })}
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
  )
}
