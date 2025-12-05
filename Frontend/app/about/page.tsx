import { Navbar } from "@/components/navbar"

const galleryImages = [
  { src: "/women-in-art-podcast-colorful.jpg", alt: "Women in Art Podcast" },
  { src: "/mobile-phone-app-dark-mode.jpg", alt: "Mobile App" },
  { src: "/yellow-tulips-flowers-green-background.jpg", alt: "Yellow Tulips" },
  { src: "/mobile-phone-yellow-app-interface.jpg", alt: "Yellow App" },
  { src: "/nike-sneakers-shoes-purple-magenta.jpg", alt: "Nike Sneakers" },
  { src: "/person-sitting-pink-background-fashion.jpg", alt: "Fashion Portrait" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-16 md:py-24">
        <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#1a365d] leading-tight mb-4 sm:mb-6 lg:mb-8">
              Our Founders'
              <br />
              Story
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              One Dash is a tool to help you share everything you are, in one simple link – making your online content
              more discoverable, easier to manage and more likely to convert. Here's where it all began.
            </p>
          </div>

          {/* Right Gallery Grid */}
          <div className="flex-1 w-full">
            <div className="bg-[#1a365d] rounded-2xl sm:rounded-3xl p-3 sm:p-4 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="rounded-xl sm:rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95"
                  >
                    <img
                      src={image.src || "/placeholder.svg"}
                      alt={image.alt}
                      className="w-full h-full object-cover aspect-square"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
