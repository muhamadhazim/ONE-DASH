"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

export function BentoSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="py-10 sm:py-16 md:py-24 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div
            className={cn(
              "bg-[#22c55e] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[240px] sm:min-h-[300px] flex flex-col justify-end opacity-0",
              "transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02]",
              "group cursor-pointer active:scale-[0.98]",
              isVisible && "animate-fade-up",
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
                <img src="/butterfly-nature-photo.jpg" alt="Content preview" className="w-full h-full object-cover" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black flex items-center justify-center transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                <span className="text-white text-lg sm:text-xl">♪</span>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                <p className="text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2">Support us</p>
                <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs transition-colors hover:bg-[#5DADE2] hover:text-white cursor-pointer">
                    $10
                  </span>
                  <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs transition-colors hover:bg-[#5DADE2] hover:text-white cursor-pointer">
                    $25
                  </span>
                  <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs transition-colors hover:bg-[#5DADE2] hover:text-white cursor-pointer">
                    $50
                  </span>
                </div>
                <button className="w-full bg-black text-white text-[10px] sm:text-xs py-1 sm:py-1.5 rounded transition-all duration-300 hover:bg-[#1a365d] hover:scale-105">
                  Donate
                </button>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1a365d] transition-transform duration-300 group-hover:translate-x-2">
              Share your content in limitless
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              ways on your One Dash.
            </h3>
          </div>

          <div
            className={cn(
              "bg-[#5DADE2]/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[240px] sm:min-h-[300px] flex flex-col justify-end opacity-0",
              "transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02]",
              "group cursor-pointer active:scale-[0.98]",
              isVisible && "animate-fade-up animation-delay-200",
            )}
          >
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img
                src="/email-subscribers-dashboard-with-notification-icon.jpg"
                alt="Email subscribers"
                className="max-h-36 sm:max-h-48 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2"
              />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#5DADE2] transition-transform duration-300 group-hover:translate-x-2">
              Grow, own and engage your
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              audience by unifying them in one place.
            </h3>
          </div>

          <div
            className={cn(
              "bg-[#d4e157] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[240px] sm:min-h-[300px] flex flex-col justify-end opacity-0",
              "transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:scale-[1.02]",
              "group cursor-pointer active:scale-[0.98]",
              isVisible && "animate-fade-up animation-delay-300",
            )}
          >
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img
                src="/revenue-dashboard-with-product-cards-showing-dolla.jpg"
                alt="Revenue dashboard"
                className="max-h-32 sm:max-h-40 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
              />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1a365d] transition-transform duration-300 group-hover:translate-x-2">
              Sell products and collect
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              payments. It's monetization made simple.
            </h3>
          </div>

          <div
            className={cn(
              "bg-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[200px] sm:min-h-[300px] opacity-0",
              "transition-all duration-500 hover:bg-gradient-to-br hover:from-[#5DADE2]/20 hover:to-[#E07B54]/20",
              "hover:shadow-xl hover:-translate-y-3 active:scale-[0.98]",
              isVisible && "animate-fade-up animation-delay-400",
            )}
          />
        </div>
      </div>
    </section>
  )
}
