"use client"

import { Settings, Users, Globe } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Settings,
    title: "Integrate your One Dash with your existing tech",
    description:
      "One Dash seamlessly connects to other platforms like Mailchimp, Vimeo, Zapier, Amazon, YouTube, Google Analytics, plus more!",
  },
  {
    icon: Users,
    title: "Grow your followers across all your social platforms",
    description:
      "Give your followers easy access to all of your content in one simple link. Now everything you do is just one tap away!",
  },
  {
    icon: Globe,
    title: "Create a custom mini-website in seconds",
    description:
      "Create your own One Dash in just seconds and customize it in a way that reflects your brand or style.",
  },
]

export function FeaturesSection() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation()
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation()

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <h2
          ref={titleRef}
          className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-[#1a365d] opacity-0 px-2",
            titleVisible && "animate-fade-up",
          )}
        >
          You never have to change the link in
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          your bio again
        </h2>

        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "p-4 sm:p-6 rounded-xl border border-border bg-card opacity-0",
                "transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-[#5DADE2]/50",
                "group cursor-pointer active:scale-[0.98]",
                cardsVisible && "animate-scale-in",
                cardsVisible && index === 0 && "animation-delay-100",
                cardsVisible && index === 1 && "animation-delay-200",
                cardsVisible && index === 2 && "animation-delay-300",
              )}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 group-hover:bg-[#5DADE2]/20 group-hover:scale-110 group-hover:rotate-6">
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#1a365d] transition-colors duration-300 group-hover:text-[#5DADE2]" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[#1a365d] transition-colors duration-300 group-hover:text-[#5DADE2]">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
