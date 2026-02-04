"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  })

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard")
    }
  }, [router])

  // Auto-fill username from query parameter
  useEffect(() => {
    const usernameParam = searchParams.get("username")
    if (usernameParam) {
      setFormData((prev) => ({ ...prev, username: usernameParam }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate email format
    if (!formData.email.includes("@")) {
      setError("Email must contain @ symbol")
      setLoading(false)
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format")
      setLoading(false)
      return
    }

    // Validate username (alphanumeric only)
    const usernameRegex = /^[a-zA-Z0-9]+$/
    if (!usernameRegex.test(formData.username)) {
      setError("Username can only contain letters and numbers")
      setLoading(false)
      return
    }

    // Validate password
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Store token in localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 py-8 sm:py-12 bg-gradient-to-b from-gray-100/50 to-white">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-1 mb-8 sm:mb-16">
            <span className="text-xl sm:text-2xl font-semibold text-[#5DADE2]">One</span>
            <span className="text-xl sm:text-2xl font-semibold text-[#1a365d]">Dash</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a365d] mb-6 sm:mb-10">
            Create your One Dash account
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 bg-gray-100 border-0 rounded-full px-5 sm:px-6 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-12 bg-gray-100 border-0 rounded-full px-5 sm:px-6 text-sm sm:text-base"
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 bg-gray-100 border-0 rounded-full px-5 sm:px-6 pr-12 text-sm sm:text-base"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#4A7DFF] hover:bg-[#3a6dee] text-white rounded-full text-sm sm:text-base font-medium active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-xs sm:text-sm text-[#5DADE2] hover:underline">
              Log in
            </Link>
          </div>

          <p className="mt-8 sm:mt-16 text-[10px] sm:text-xs text-center text-muted-foreground px-4">
            This site is protected by reCAPTCHA and the{" "}
            <Link href="#" className="underline">
              Google Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline">
              Terms of Service
            </Link>{" "}
            apply.
          </p>
        </div>
      </div>

      {/* Right Side - Image (hidden on mobile) */}
      <div className="hidden lg:block flex-1 bg-[#e8b4d8] relative overflow-hidden">
        <img
          src="/auth-hero.jpg"
          alt="Creator with social media icons"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <button className="absolute bottom-8 right-8 w-12 h-12 bg-[#1a365d] rounded-full flex items-center justify-center text-white hover:bg-[#0f1f3d] transition-colors">
          ?
        </button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
