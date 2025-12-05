// Theme definitions for public profile pages

export type ThemeId = 'sunset' | 'ocean' | 'midnight' | 'nature' | 'rose'

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  description: string
  background: string
  pageBackground: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  accentHover: string
  buttonBg: string
  buttonText: string
  isDark: boolean
}

export const themes: Record<ThemeId, Theme> = {
  sunset: {
    id: 'sunset',
    name: 'Sunset Affiliate',
    emoji: '🌅',
    description: 'Warm & welcoming for e-commerce',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFB347 100%)',
    pageBackground: 'bg-gradient-to-b from-orange-50/50 via-white to-gray-50',
    cardBg: 'bg-white',
    cardBorder: 'border-orange-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    accent: '#FF6B35',
    accentHover: '#e55a2b',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    buttonText: 'text-white',
    isDark: false
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Trust',
    emoji: '🌊',
    description: 'Professional & trustworthy',
    background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #4299e1 100%)',
    pageBackground: 'bg-gradient-to-b from-blue-50/50 via-white to-slate-50',
    cardBg: 'bg-white',
    cardBorder: 'border-blue-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    accent: '#3182ce',
    accentHover: '#2c5282',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    buttonText: 'text-white',
    isDark: false
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Flash',
    emoji: '🌙',
    description: 'Dark mode for tech & gaming',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
    pageBackground: 'bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a]',
    cardBg: 'bg-[#1f1f3a]/80 backdrop-blur-sm',
    cardBorder: 'border-purple-500/20',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-500',
    accent: '#9333ea',
    accentHover: '#7e22ce',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-pink-600',
    buttonText: 'text-white',
    isDark: true
  },
  nature: {
    id: 'nature',
    name: 'Fresh Nature',
    emoji: '🌿',
    description: 'Organic & healthy vibes',
    background: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
    pageBackground: 'bg-gradient-to-b from-emerald-50/50 via-white to-green-50',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    accent: '#10b981',
    accentHover: '#059669',
    buttonBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    buttonText: 'text-white',
    isDark: false
  },
  rose: {
    id: 'rose',
    name: 'Rose Gold',
    emoji: '🌸',
    description: 'Elegant for fashion & beauty',
    background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #db2777 100%)',
    pageBackground: 'bg-gradient-to-b from-pink-50/50 via-white to-rose-50',
    cardBg: 'bg-white',
    cardBorder: 'border-pink-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    accent: '#ec4899',
    accentHover: '#db2777',
    buttonBg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    buttonText: 'text-white',
    isDark: false
  }
}

export const themeList = Object.values(themes)

export function getTheme(themeId: string | undefined): Theme {
  if (themeId && themeId in themes) {
    return themes[themeId as ThemeId]
  }
  return themes.sunset // default
}
