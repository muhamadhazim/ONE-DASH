"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const { ref: textRef, isVisible: textVisible } = useScrollAnimation()
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation()

  return (
    <section className="py-8 sm:py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12">
          <div
            ref={textRef}
            className={cn(
              "flex-1 space-y-4 sm:space-y-6 opacity-0 text-center md:text-left",
              textVisible && "animate-slide-in-left",
            )}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-[#5DADE2]">Everything you are.</span>
              <br />
              <span className="text-[#E07B54]">In one simple link.</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-md mx-auto md:mx-0">
              Join 25M+ people and share everything you create, curate and sell online. All from the one link in bio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0">
              <Input
                placeholder="onedash/yourname"
                className="h-12 sm:h-11 bg-gray-100 border-0 transition-all duration-300 hover:bg-gray-200 focus:scale-[1.02] focus:shadow-md text-sm"
              />
              <Button className="h-12 sm:h-11 bg-[#1a365d] hover:bg-[#152a4d] text-white px-6 whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 text-sm">
                Claim your One Dash
              </Button>
            </div>
          </div>

          <div
            ref={imageRef}
            className={cn("flex-1 relative opacity-0 w-full", imageVisible && "animate-slide-in-right")}
          >
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto animate-float">
              <img
                src="/mobile-app-mockup-with-social-media-cards-and-prof.jpg"
                alt="One Dash App Preview"
                className="w-full h-auto transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
