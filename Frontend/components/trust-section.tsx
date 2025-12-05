"use client"

import { Star } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

export function TrustSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="py-10 sm:py-16 md:py-24 overflow-hidden">
      <div ref={ref} className="mx-auto max-w-6xl px-3 sm:px-4 text-center">
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-2 mb-3 sm:mb-4 opacity-0",
            isVisible && "animate-fade-up",
          )}
        >
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">Excellent</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 bg-[#00b67a] flex items-center justify-center opacity-0",
                  "transition-transform duration-300 hover:scale-125",
                  isVisible && "animate-bounce-in",
                )}
                style={{ animationDelay: isVisible ? `${(i + 1) * 100}ms` : "0ms" }}
              >
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white fill-white" />
              </div>
            ))}
          </div>
          <span className="text-xs sm:text-sm font-medium flex items-center gap-1">
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00b67a] fill-[#00b67a]" />
            Trustpilot
          </span>
        </div>
        <h2
          className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a365d] opacity-0",
            isVisible && "animate-fade-up animation-delay-300",
          )}
        >
          Trusted by 25M+
        </h2>
        <p
          className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold text-[#22c55e] opacity-0",
            isVisible && "animate-fade-up animation-delay-400",
          )}
        >
          models
        </p>
      </div>
    </section>
  )
}
