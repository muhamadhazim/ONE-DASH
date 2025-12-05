"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly")

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a365d]">
            Pick the perfect plan
          </h1>

          <div className="flex flex-col items-start lg:items-end gap-2 sm:gap-3 w-full lg:w-auto">
            <span className="text-xs sm:text-sm text-muted-foreground">Save with annual plans</span>
            <div className="flex items-center bg-white rounded-full p-1 border border-border">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors",
                  billingPeriod === "monthly" ? "bg-[#1a365d] text-white" : "text-muted-foreground",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annually")}
                className={cn(
                  "px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors",
                  billingPeriod === "annually" ? "bg-[#1a365d] text-white" : "text-muted-foreground",
                )}
              >
                Annually
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Free Plan */}
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]">
            <CardHeader className="bg-[#4A7DFF] text-white p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold">Free</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-bold">$0</span>
                <span className="text-xs sm:text-sm opacity-80">USD/month</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-muted-foreground text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                Unlimited links and a customizable One Dash to connect your community to everything you are.
              </p>
              <Button
                variant="outline"
                className="w-full h-11 sm:h-10 rounded-full border-[#4A7DFF] text-[#4A7DFF] hover:bg-[#4A7DFF]/10 bg-transparent text-sm active:scale-[0.98] transition-transform"
              >
                Join for free
              </Button>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card className="overflow-hidden border-2 border-[#22c55e] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]">
            <CardHeader className="bg-[#22c55e] text-white p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold">Starter</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-bold">${billingPeriod === "monthly" ? "5" : "4"}</span>
                <span className="text-xs sm:text-sm opacity-80">USD/month</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-muted-foreground text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                More customization and control for creators ready to drive more traffic to their One Dash.
              </p>
              <Button className="w-full h-11 sm:h-10 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm active:scale-[0.98] transition-transform">
                Get started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="overflow-hidden sm:col-span-2 md:col-span-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]">
            <CardHeader className="bg-[#1a365d] text-white p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold">Pro</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-bold">${billingPeriod === "monthly" ? "9" : "7"}</span>
                <span className="text-xs sm:text-sm opacity-80">USD/month</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-muted-foreground text-center mb-4 sm:mb-6 text-xs sm:text-sm">
                Grow, learn about and own your following forever with a professional One Dash.
              </p>
              <Button
                variant="outline"
                className="w-full h-11 sm:h-10 rounded-full border-[#1a365d] text-[#1a365d] hover:bg-[#1a365d]/10 bg-transparent text-sm active:scale-[0.98] transition-transform"
              >
                Try for free
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
