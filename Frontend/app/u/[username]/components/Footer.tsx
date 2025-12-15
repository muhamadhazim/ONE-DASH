import React from "react"
import Link from "next/link"
import { Verified } from "lucide-react"

type FooterProps = {
  theme: any
  mounted: boolean
}

export default function Footer({ theme, mounted }: FooterProps) {
  return (
    <>
      <div
        className={`mt-5 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-500 delay-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ 
          background: `linear-gradient(to right, ${theme.accent}0D, ${theme.accent}1A)`, // 5% to 10% opacity
          borderColor: `${theme.accent}33` // 20% opacity
        }}
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${theme.accent}1A` }}
          >
            <Verified className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
          </div>
          <div className="min-w-0">
            <h4 
              className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1"
              style={{ color: theme.accent }}
            >
              Trusted Affiliate Partner
            </h4>
            <p className={`text-[10px] sm:text-xs leading-relaxed ${theme.textSecondary}`}>
              Semua link produk sudah diverifikasi dan aman. Dapatkan harga terbaik langsung dari seller terpercaya.
            </p>
          </div>
        </div>
      </div>
      <div
        className={`mt-6 sm:mt-8 text-center transition-all duration-500 delay-600 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-4 py-2.5 sm:py-2 rounded-full bg-white border border-gray-200 hover:shadow-md active:scale-95 transition-all duration-300"
          style={{ borderColor: 'transparent' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
        >
          <span className="text-[#5DADE2] font-bold">One</span>
          <span className="text-gray-600 font-medium">Dash</span>
        </Link>
        <p className="text-gray-400 text-[10px] sm:text-xs mt-2">Buat link affiliate gratis kamu</p>
      </div>
    </>
  )
}
