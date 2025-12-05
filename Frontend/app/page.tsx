import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TrustSection } from "@/components/trust-section"
import { BentoSection } from "@/components/bento-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TrustSection />
        <BentoSection />
      </main>
      <Footer />
    </div>
  )
}
