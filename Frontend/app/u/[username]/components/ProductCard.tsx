import React from "react"
import Image from "next/image"
import { ShoppingBag, Star, ChevronRight, Percent } from "lucide-react"
import { Product } from "./types"
import { formatPrice, formatSold, marketplaceConfig, detectMarketplace } from "./utils"

type ProductCardProps = {
  product: Product
  theme: any
  mounted: boolean
  index: number
  trackProductClick: (product: Product) => void
}

export default function ProductCard({ product, theme, mounted, index, trackProductClick }: ProductCardProps) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackProductClick(product)}
      className={`group block transition-all duration-500 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${300 + index * 75}ms` }}
    >
      <div 
        className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.accent + '4D' // 30% opacity
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = ''
        }}
      >
        {/* Marketplace Badge - Top Right Corner of Card */}
        {(() => {
          const marketplace = product.platform || detectMarketplace(product.url)
          if (marketplace && marketplaceConfig[marketplace]) {
            const config = marketplaceConfig[marketplace]
            return (
              <div
                className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} ${config.textColor} text-[10px] sm:text-xs font-semibold shadow-md`}
              >
                <span>{config.logo}</span>
                <span>{config.name}</span>
              </div>
            )
          }
          return null
        })()}

        <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3">
          {/* Product Image */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                width={96}
                height={96}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
              </div>
            )}

            {/* Discount Badge - Bottom of Image */}
            {product.discount && (
              <div className="absolute bottom-1 left-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                -{product.discount}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 
                className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight mb-1 line-clamp-2 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {product.title}
              </h3>
              {/* Rating and Sold */}
              {(product.rating || product.sold) && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-1">
                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating.toFixed(2)}</span>
                    </div>
                  )}
                  {product.sold && (
                    <span className="text-gray-400">• {formatSold(product.sold)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                {product.price ? (
                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold" style={{ color: theme.accent }}>{formatPrice(product.price)}</span>
                    {product.originalPrice != null && product.originalPrice > 0 && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm text-gray-500">{product.subtitle || "Lihat detail"}</span>
                )}
              </div>

              <div 
                className="flex items-center gap-1 text-white px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold shadow-md group-hover:brightness-90 active:brightness-75 transition-all shrink-0"
                style={{ backgroundColor: theme.accent }}
              >
                <span>Beli</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Savings Banner - if discount exists */}
        {product.discount && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-2.5 sm:px-3 py-1.5 sm:py-2 border-t border-green-100">
            <div className="flex items-center gap-1 sm:gap-1.5 text-green-700">
              <Percent className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate">
                Hemat hingga {product.discount} dengan link ini!
              </span>
            </div>
          </div>
        )}
      </div>
    </a>
  )
}
