import React from "react"
import { Search, ShoppingBag } from "lucide-react"
import { Profile } from "./types"

type ProductFiltersProps = {
  profile: Profile
  theme: any
  mounted: boolean
  activeCategory: string
  setActiveCategory: (category: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredCount: number
}

export default function ProductFilters({
  profile,
  theme,
  mounted,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  filteredCount
}: ProductFiltersProps) {
  const categories = ["all", ...(profile.categories || [])]

  return (
    <>
      <div
        className={`relative mb-3 sm:mb-4 transition-all duration-500 delay-175 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 sm:h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none transition-all"
          style={{ 
            caretColor: theme.accent,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.accent
            e.target.style.boxShadow = `0 0 0 2px ${theme.accent}33`
          }}
          onBlur={(e) => {
            e.target.style.borderColor = ''
            e.target.style.boxShadow = ''
          }}
        />
      </div>

      <div
        className={`flex items-center justify-between mb-2 sm:mb-3 transition-all duration-500 delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
          <h2 className={`font-bold text-sm sm:text-base ${theme.textPrimary}`}>Rekomendasi Produk</h2>
        </div>
        <span 
          className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ 
            backgroundColor: `${theme.accent}1A`, // 10% opacity
            color: theme.accent 
          }}
        >
          {filteredCount} items
        </span>
      </div>

      {profile.categories && profile.categories.length > 0 && (
        <div
          className={`flex gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory transition-all duration-500 delay-250 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 snap-start min-h-[40px] sm:min-h-0 ${
                activeCategory === cat
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              }`}
              style={activeCategory === cat ? { backgroundColor: theme.accent } : {}}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
