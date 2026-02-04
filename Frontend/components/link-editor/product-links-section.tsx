import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Loader2, RefreshCw, Trash2, Plus } from "lucide-react"
import { LinkItem, Message } from "./types"
import { useState } from "react"

interface ProductLinksSectionProps {
  links: LinkItem[]
  setLinks: (links: LinkItem[]) => void
  onMessage: (message: Message) => void
  apiUrl: string
}

export function ProductLinksSection({ links, setLinks, onMessage, apiUrl }: ProductLinksSectionProps) {
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null)

  const addLink = () => {
    setLinks([...links, { title: "", subtitle: "", url: "", category: "" }])
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    let processedValue: string | number = value
    if (field === 'rating' || field === 'price' || field === 'sold' || field === 'original_price') {
      processedValue = value ? parseFloat(value) : 0
    }
    
    // Validate field lengths and show warning, but still allow update
    if (field === 'title' && typeof value === 'string' && value.length > 255) {
      onMessage({ type: "error", text: "Product name cannot exceed 255 characters" })
    } else if (field === 'subtitle' && typeof value === 'string' && value.length > 255) {
      onMessage({ type: "error", text: "Subtitle cannot exceed 255 characters" })
    } else if (field === 'url' && typeof value === 'string' && value.length > 1000) {
      onMessage({ type: "error", text: "URL cannot exceed 1000 characters" })
    } else {
      // Clear error message if within limit
      onMessage({ type: "", text: "" })
    }
    
    setLinks(links.map((link, i) => (i === index ? { ...link, [field]: processedValue } : link)))
  }

  const scrapeLink = async (index: number) => {
    const link = links[index]
    if (!link.url) {
      onMessage({ type: "error", text: "Please enter a URL first" })
      return
    }

    setScrapingIndex(index)
    onMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/api/links/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: link.url }),
      })

      if (!response.ok) {
        throw new Error("Failed to scrape URL")
      }

      const data = await response.json()
      
      setLinks(links.map((l, i) => {
        if (i === index) {
          return {
            ...l,
            title: data.title || l.title,
            image: data.image_url || data.image || l.image,
            price: data.price || l.price,
            original_price: data.original_price || l.original_price,
            discount: data.discount || l.discount,
            category: data.category || l.category,
            rating: data.rating || l.rating,
            sold: data.sold || l.sold,
            platform: data.platform || l.platform,
          }
        }
        return l
      }))

      onMessage({ type: "success", text: "Product data fetched!" })
      setTimeout(() => onMessage({ type: "", text: "" }), 2000)
    } catch (error) {
      onMessage({ type: "error", text: "Could not fetch product data" })
    } finally {
      setScrapingIndex(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-[#FF6B35]" />
        Product Links
      </h2>
      
      <div className="space-y-4">
        {links.map((link, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-start gap-3">
              {/* Product Image Preview */}
              <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                {link.image ? (
                  <img src={link.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={link.title}
                  onChange={(e) => updateLink(index, "title", e.target.value)}
                  placeholder="Product name"
                />
                <div className="flex gap-2">
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    placeholder="https://shopee.co.id/product..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrapeLink(index)}
                    disabled={scrapingIndex === index}
                    className="shrink-0 gap-1"
                    title="Fetch product data from URL"
                  >
                    {scrapingIndex === index ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={link.price || ""}
                    onChange={(e) => updateLink(index, "price", e.target.value)}
                    placeholder="Rp 100.000"
                  />
                  <Input
                    value={link.category || ""}
                    onChange={(e) => updateLink(index, "category", e.target.value)}
                    placeholder="Category"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={link.rating || ""}
                    onChange={(e) => updateLink(index, "rating", e.target.value)}
                    placeholder="Rating (0-5)"
                  />
                  <Input
                    value={link.sold || ""}
                    onChange={(e) => updateLink(index, "sold", e.target.value)}
                    placeholder="Sold/Reviews"
                  />
                  <div className="flex items-center">
                    {link.platform && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full capitalize">
                        {link.platform}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLink(index)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addLink}
          className="w-full border-dashed gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product Link
        </Button>
      </div>
    </div>
  )
}
