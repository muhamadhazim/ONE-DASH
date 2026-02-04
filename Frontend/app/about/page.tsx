import { Navbar } from "@/components/navbar";

const galleryImages = [
  { src: "/aboutus/hazim.jpg", alt: "Muhammad Hazim Robbani" },
  { src: "/aboutus/iqbal.jpg", alt: "Muhammad Iqbal Reza" },
  { src: "/aboutus/sierly.jpg", alt: "Sierly Putri Anjani" },
  { src: "/aboutus/azka.jpg", alt: "Muhammad Azka" },
  { src: "/aboutus/raka.jpg", alt: "Rakha Putra Falah" },
];

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
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              One Dash is a tool to help you share everything you are, in one
              simple link – making your online content more discoverable, easier
              to manage and more likely to convert.
              <br />
              Meet the team behind One Dash: Muhammad Hazim Robbani, Muhammad
              Iqbal Reza, Sierly Putri Anjani, Muhammad Azka, and Rakha Putra
              Falah.
            </p>
          </div>

          {/* Right Gallery Grid */}
          <div className="flex-1 w-full">
            <div className="bg-[#1a365d] rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* First row - 2 images */}
                {galleryImages.slice(0, 2).map((image, index) => (
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
                {/* Second row - 3 images in a nested grid */}
                <div className="col-span-2 grid grid-cols-3 gap-3 sm:gap-4">
                  {galleryImages.slice(2, 5).map((image, index) => (
                    <div
                      key={index + 2}
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
        </div>
      </main>
    </div>
  );
}
