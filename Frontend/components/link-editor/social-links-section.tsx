import { Share2, Mail, Phone, Instagram, Youtube, Github, Send, Music } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ContactItem, SocialOption } from "./types"

interface SocialLinksSectionProps {
  contacts: ContactItem[]
  setContacts: (contacts: ContactItem[]) => void
}

const socialOptions: SocialOption[] = [
  { type: "instagram", icon: Instagram, label: "Instagram", color: "#E4405F" },
  { type: "youtube", icon: Youtube, label: "YouTube", color: "#FF0000" },
  { type: "tiktok", icon: Music, label: "TikTok", color: "#000000" },
  { type: "email", icon: Mail, label: "Email", color: "#EA4335" },
  { type: "whatsapp", icon: Phone, label: "WhatsApp", color: "#25D366" },
  { type: "github", icon: Github, label: "GitHub", color: "#181717" },
  { type: "telegram", icon: Send, label: "Telegram", color: "#0088cc" },
]

export function SocialLinksSection({ contacts, setContacts }: SocialLinksSectionProps) {
  const toggleContact = (type: string) => {
    const existing = contacts.find(c => c.type === type)
    if (existing) {
      setContacts(contacts.filter(c => c.type !== type))
    } else {
      setContacts([...contacts, { type, url: "" }])
    }
  }

  const updateContact = (type: string, url: string) => {
    setContacts(contacts.map(c => (c.type === type ? { ...c, url } : c)))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-[#FF6B35]" />
        Social Links
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {socialOptions.map((social) => {
          const isActive = contacts.some(c => c.type === social.type)
          return (
            <button
              key={social.type}
              onClick={() => toggleContact(social.type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                isActive 
                  ? "bg-[#FF6B35] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <social.icon className="h-4 w-4" />
              {social.label}
            </button>
          )
        })}
      </div>

      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map((contact) => {
            const social = socialOptions.find(s => s.type === contact.type)
            return (
              <div key={contact.type} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {social && <social.icon className="h-4 w-4 text-gray-600" />}
                </div>
                <Input
                  value={contact.url}
                  onChange={(e) => updateContact(contact.type, e.target.value)}
                  placeholder={`${social?.label} URL or username`}
                  className="flex-1"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
