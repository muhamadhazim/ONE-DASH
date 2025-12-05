"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Mail, Lock, Loader2, Check, AlertCircle, Eye, EyeOff, ShieldAlert } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" })
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })
  
  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Confirmation dialogs
  const [showProfileConfirm, setShowProfileConfirm] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  
  const [originalData, setOriginalData] = useState({ username: "", email: "" })
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (!token) {
      router.push("/login")
      return
    }

    if (userData) {
      try {
        const user = JSON.parse(userData)
        const data = {
          username: user.username || "",
          email: user.email || "",
        }
        setFormData(prev => ({ ...prev, ...data }))
        setOriginalData(data)
      } catch {
        // ignore
      }
    }
    setLoading(false)
  }, [router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if anything changed
    if (formData.username !== originalData.username || formData.email !== originalData.email) {
      setShowProfileConfirm(true)
      return
    }
    
    setProfileMessage({ type: "info", text: "Tidak ada perubahan" })
  }

  const confirmSaveProfile = async () => {
    setShowProfileConfirm(false)
    setSaving(true)
    setProfileMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      // Update localStorage
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        user.username = formData.username
        user.email = formData.email
        localStorage.setItem("user", JSON.stringify(user))
      }
      
      setOriginalData({ username: formData.username, email: formData.email })
      setProfileMessage({ type: "success", text: "Profil berhasil diperbarui!" })
    } catch (err) {
      setProfileMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal memperbarui profil" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage({ type: "", text: "" })
    
    if (!formData.currentPassword) {
      setPasswordMessage({ type: "error", text: "Masukkan password saat ini" })
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Password baru tidak cocok" })
      return
    }

    if (formData.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password minimal 6 karakter" })
      return
    }

    setShowPasswordConfirm(true)
  }

  const confirmChangePassword = async () => {
    setShowPasswordConfirm(false)
    setSaving(true)
    setPasswordMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      setPasswordMessage({ type: "success", text: "Password berhasil diubah!" })
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err) {
      setPasswordMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengubah password" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#5DADE2] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a365d] mb-6">Account Settings</h1>

        {/* Profile Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[#5DADE2]" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 h-11 bg-gray-100 border-0"
                  placeholder="Your username"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public page: onedash.com/u/{formData.username || "username"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-11 bg-gray-100 border-0"
                  placeholder="you@example.com"
                />
              </div>

              {/* Profile Message - Below inputs */}
              {profileMessage.text && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  profileMessage.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : profileMessage.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {profileMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {profileMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-[#4A7DFF] hover:bg-[#3a6dee] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-[#E07B54]" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="h-11 bg-gray-100 border-0 pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">New Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="h-11 bg-gray-100 border-0 pr-10"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-11 bg-gray-100 border-0 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Message - Below inputs */}
              {passwordMessage.text && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  passwordMessage.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {passwordMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {passwordMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={saving}
                variant="outline"
                className="w-full h-11 border-[#E07B54] text-[#E07B54] hover:bg-[#E07B54] hover:text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Profile Confirmation Dialog */}
      <Dialog open={showProfileConfirm} onOpenChange={setShowProfileConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#5DADE2]" />
              Konfirmasi Perubahan Profil
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>Anda akan mengubah informasi profil:</p>
              {formData.username !== originalData.username && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Username:</span>{" "}
                  <span className="line-through text-red-500">{originalData.username}</span>{" "}
                  → <span className="text-green-600 font-medium">{formData.username}</span>
                </p>
              )}
              {formData.email !== originalData.email && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="line-through text-red-500">{originalData.email}</span>{" "}
                  → <span className="text-green-600 font-medium">{formData.email}</span>
                </p>
              )}
              <p className="text-amber-600 text-sm mt-3">
                ⚠️ Username adalah identitas link publik Anda. Pastikan perubahan ini benar.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowProfileConfirm(false)}>
              Batal
            </Button>
            <Button onClick={confirmSaveProfile} className="bg-[#4A7DFF] hover:bg-[#3a6dee]">
              Ya, Ubah Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <Dialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#E07B54]" />
              Konfirmasi Ganti Password
            </DialogTitle>
            <DialogDescription className="pt-2">
              <p>Anda yakin ingin mengubah password?</p>
              <p className="text-amber-600 text-sm mt-3">
                ⚠️ Setelah password diubah, Anda perlu login ulang dengan password baru.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPasswordConfirm(false)}>
              Batal
            </Button>
            <Button onClick={confirmChangePassword} className="bg-[#E07B54] hover:bg-[#d06a43]">
              Ya, Ganti Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
