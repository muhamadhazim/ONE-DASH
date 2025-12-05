"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShoppingBag, Star, Package, MapPin } from "lucide-react"
import Image from "next/image"

interface ProductData {
  platform: string
  id: string
  name: string
  price: number
  originalPrice: number | null
  discount: number
  image: string
  images: string[]
  sold: number
  stock: number
  rating: number
  ratingCount?: number
  shop: {
    id?: string
    name: string
  }
  location?: string
}

export default function TestApiPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ProductData | null>(null)
  const [error, setError] = useState("")

  const fetchProduct = async () => {
    if (!url) return

    setLoading(true)
    setError("")
    setProduct(null)

    try {
      const response = await fetch(`/api/product?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product")
      }

      setProduct(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Test Product API</h1>
          <p className="text-gray-600">Paste Shopee atau Tokopedia link untuk mengambil data produk</p>
        </div>

        {/* Input Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Paste link Shopee/Tokopedia..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && fetchProduct()}
              />
              <Button onClick={fetchProduct} disabled={loading || !url} className="bg-orange-500 hover:bg-orange-600">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Fetch Product
                  </>
                )}
              </Button>
            </div>

            {/* Example Links */}
            <div className="mt-3 text-xs text-gray-500">
              <p className="font-medium">Contoh link:</p>
              <p className="mt-1 break-all">Shopee: https://shopee.co.id/Product-Name-i.123456.789012</p>
              <p className="break-all">Tokopedia: https://www.tokopedia.com/shopname/product-slug</p>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Product Result */}
        {product && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-400 text-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                {product.platform === "shopee" ? "Shopee" : "Tokopedia"} Product
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative aspect-square w-full bg-gray-100">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
                {product.discount > 0 && (
                  <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    -{product.discount}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">{product.name}</h2>

                {/* Price */}
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-orange-500">{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      {product.ratingCount && <span className="text-gray-400">({product.ratingCount})</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{product.sold.toLocaleString()} terjual</span>
                  </div>
                  {product.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{product.location}</span>
                    </div>
                  )}
                </div>

                {/* Shop */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Toko:</span> {product.shop.name}
                  </p>
                </div>

                {/* Raw JSON */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Lihat Raw JSON Response
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                    {JSON.stringify(product, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
