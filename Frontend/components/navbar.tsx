"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

interface NavbarProps {
  isLoggedIn?: boolean
}

export function Navbar({ isLoggedIn: propIsLoggedIn }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn ?? false)
  const [username, setUsername] = useState("")

  useEffect(() => {
    // Check localStorage for auth state
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (token && userData) {
      setIsLoggedIn(true)
      try {
        const user = JSON.parse(userData)
        setUsername(user.username || "")
      } catch {
        setUsername("")
      }
    } else {
      setIsLoggedIn(propIsLoggedIn ?? false)
    }
  }, [propIsLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    router.push("/")
  }

  const navLinks = isLoggedIn
    ? [
        { href: "/", label: "Home" },
        { href: "/about", label: "About us" },
        { href: "/pricing", label: "Pricing" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/about", label: "About us" },
        { href: "/pricing", label: "Pricing" },
      ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background animate-fade-in">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <nav className="flex h-14 sm:h-16 items-center justify-between rounded-full border border-border bg-background px-4 sm:px-6 my-2 sm:my-4 shadow-sm transition-all duration-300 hover:shadow-md">
          <Link href="/" className="flex items-center gap-1 transition-transform duration-300 hover:scale-105">
            <span className="text-lg sm:text-xl font-semibold text-[#5DADE2]">One</span>
            <span className="text-lg sm:text-xl font-semibold text-[#1a365d]">Dash</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300 hover:text-[#5DADE2] relative group",
                  pathname === link.href ? "text-[#1a365d] font-semibold" : "text-muted-foreground",
                )}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#5DADE2] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 bg-[#E07B54] transition-all duration-300 hover:scale-110 hover:ring-4 hover:ring-[#E07B54]/30 cursor-pointer">
                    <AvatarFallback className="bg-[#E07B54] text-white font-semibold">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-[#E07B54] text-[#E07B54] hover:bg-[#E07B54] hover:text-white bg-transparent transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-[#E07B54] hover:bg-[#d06a44] text-white rounded-full px-4 sm:px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                  >
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#E07B54] text-[#E07B54] hover:bg-[#E07B54] hover:text-white rounded-full px-4 sm:px-6 bg-transparent transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden absolute left-3 right-3 top-16 sm:top-20 bg-white rounded-2xl border border-border shadow-lg p-4 animate-fade-in z-50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-[#5DADE2]/10 text-[#5DADE2]"
                      : "text-gray-600 hover:bg-gray-100 active:bg-gray-200",
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-2" />

              {isLoggedIn ? (
                <div className="flex items-center justify-between px-4 py-2">
                  <Link href="/profile" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                    <Avatar className="h-10 w-10 bg-[#E07B54]">
                      <AvatarFallback className="bg-[#E07B54] text-white font-semibold">
                        {username ? username.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{username || "Profile"}</span>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="border-[#E07B54] text-[#E07B54] bg-transparent"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#E07B54] hover:bg-[#d06a44] text-white rounded-xl h-11">Sign Up</Button>
                  </Link>
                  <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-[#E07B54] text-[#E07B54] rounded-xl h-11 bg-transparent"
                    >
                      Sign in
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
