import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, Save, Loader2, Check, AlertCircle } from "lucide-react"
import { Message } from "./types"

interface HeaderSectionProps {
  username: string
  saving: boolean
  message: Message
  onSave: () => void
}

export function HeaderSection({ username, saving, message, onSave }: HeaderSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Your Page</h1>
          <p className="text-gray-500 text-sm">Customize your profile and add affiliate links</p>
        </div>
        <div className="flex gap-2">
          <Link href={username ? `/u/${username}` : "#"} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </Link>
          <Button 
            onClick={onSave} 
            disabled={saving}
            className="gap-2 bg-[#FF6B35] hover:bg-[#E85A2A]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
