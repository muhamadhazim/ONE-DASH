import Image from "next/image"
import { Share2, MapPin, Verified, ShoppingBag, ExternalLink, Star } from "lucide-react"
import { getTheme } from "@/lib/themes"
import { ProfileData, LinkItem } from "./types"

interface PreviewPanelProps {
  profile: ProfileData
  username: string
  links: LinkItem[]
  apiUrl: string
}

export function PreviewPanel({ profile, username, links, apiUrl }: PreviewPanelProps) {
  const previewTheme = getTheme(profile.theme)

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

  return (
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
                ? `url(${profile.banner_url.startsWith('http') ? profile.banner_url : `${apiUrl}${profile.banner_url}`})` 
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
                      src={profile.avatar_url.startsWith('http') ? profile.avatar_url : `${apiUrl}${profile.avatar_url}`} 
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
  )
}
