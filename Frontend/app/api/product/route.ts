import { type NextRequest, NextResponse } from "next/server"

// Helper: Extract shop_id dan item_id dari Shopee URL
function parseShopeeUrl(url: string): { shopId: string; itemId: string } | null {
  // Format 1: https://shopee.co.id/Product-Name-i.123456.789012
  const format1 = url.match(/i\.(\d+)\.(\d+)/)
  if (format1) {
    return { shopId: format1[1], itemId: format1[2] }
  }

  // Format 2: https://shopee.co.id/product/123456/789012
  const format2 = url.match(/product\/(\d+)\/(\d+)/)
  if (format2) {
    return { shopId: format2[1], itemId: format2[2] }
  }

  // Format 3: Short link - s.shopee.co.id/xxx (perlu redirect)
  return null
}

// Helper: Extract product_id dari Tokopedia URL
function parseTokopediaUrl(url: string): { slug: string; shop: string } | null {
  // Format: https://www.tokopedia.com/shopname/product-slug
  const match = url.match(/tokopedia\.com\/([^/]+)\/([^/?]+)/)
  if (match) {
    return { shop: match[1], slug: match[2] }
  }
  return null
}

// Fetch product dari Shopee using Facebook User-Agent trick
async function fetchShopeeProduct(shopId: string, itemId: string) {
  const pageUrl = `https://shopee.co.id/product/${shopId}/${itemId}`

  const response = await fetch(pageUrl, {
    headers: {
      // THE MAGIC: Facebook crawler User-Agent
      "User-Agent": "facebookexternalhit/1.1;line-poker/1.0",
      Accept: "application/xhtml+xml",
    },
    next: { revalidate: 3600 }, // Cache 1 jam
  })

  if (!response.ok) {
    throw new Error("Failed to fetch from Shopee")
  }

  const html = await response.text()

  // Extract og:title
  let name = ""
  const ogTitleMatch = html.match(/property="og:title"[^>]*content="([^"]*)"/)
  if (ogTitleMatch) {
    name = ogTitleMatch[1]
    // Clean up: remove "Jual " prefix and " | Shopee Indonesia" suffix
    name = name.replace(/^Jual\s+/, "").replace(/\s*\|\s*Shopee.*$/, "")
  }

  // Extract og:image
  let image = ""
  const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]*)"/)
  if (ogImageMatch) {
    image = ogImageMatch[1]
  }

  // Try to get higher quality image from HTML
  const betterImageMatch = html.match(/src="(https:\/\/down-id\.img\.susercontent\.com\/file\/[^"@]+)"/)
  if (betterImageMatch) {
    image = betterImageMatch[1]
  }

  // Extract price from JSON-LD schema
  let price = 0
  let originalPrice = null
  let discount = 0
  let rating = 0
  let sold = 0

  const jsonLdMatch = html.match(/"@type"\s*:\s*"Product"[^}]*"price"\s*:\s*"?([\d.]+)"?/)
  if (jsonLdMatch) {
    price = parseFloat(jsonLdMatch[1])
  }

  // Extract rating from JSON-LD
  const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  }

  // Extract rating count
  const ratingCountMatch = html.match(/"ratingCount"\s*:\s*"?(\d+)"?/)
  const ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[1]) : 0

  return {
    platform: "shopee",
    id: itemId,
    name: name,
    price: price,
    originalPrice: originalPrice,
    discount: discount,
    image: image,
    images: [image],
    sold: sold,
    stock: 1,
    rating: rating,
    ratingCount: ratingCount,
    shop: {
      id: shopId,
      name: "Shopee",
    },
    location: "",
  }
}

// Fetch product dari Tokopedia (via pdp API)
async function fetchTokopediaProduct(shop: string, slug: string) {
  // Tokopedia menggunakan GraphQL, tapi kita bisa pakai endpoint public
  const apiUrl = `https://www.tokopedia.com/api/v1/aggregate/pdp/${shop}/${slug}`

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    // Fallback: scrape dari halaman langsung
    return fetchTokopediaFallback(shop, slug)
  }

  const data = await response.json()
  const product = data?.data?.pdpGetLayout?.components

  // Parse dari response
  const basicInfo = product?.find((c: any) => c.name === "product_content")?.data?.[0]

  if (!basicInfo) {
    return fetchTokopediaFallback(shop, slug)
  }

  return {
    platform: "tokopedia",
    id: basicInfo.id,
    name: basicInfo.name,
    price: basicInfo.price?.value || 0,
    originalPrice: basicInfo.campaign?.originalPrice || null,
    discount: basicInfo.campaign?.discountPercentage || 0,
    image: basicInfo.pictures?.[0]?.urlThumbnail || "",
    images: basicInfo.pictures?.map((p: any) => p.urlOriginal) || [],
    sold: basicInfo.txStats?.countSold || 0,
    stock: basicInfo.stock?.value || 0,
    rating: basicInfo.rating || 0,
    shop: {
      name: shop,
    },
  }
}

// Fallback untuk Tokopedia - simple HTML scrape
async function fetchTokopediaFallback(shop: string, slug: string) {
  const pageUrl = `https://www.tokopedia.com/${shop}/${slug}`

  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  })

  const html = await response.text()

  // Extract dari JSON-LD atau meta tags
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1])
      if (jsonLd["@type"] === "Product") {
        return {
          platform: "tokopedia",
          id: slug,
          name: jsonLd.name,
          price: Number.parseFloat(jsonLd.offers?.price) || 0,
          originalPrice: null,
          discount: 0,
          image: jsonLd.image || "",
          images: [jsonLd.image],
          sold: 0,
          stock: jsonLd.offers?.availability === "InStock" ? 1 : 0,
          rating: Number.parseFloat(jsonLd.aggregateRating?.ratingValue) || 0,
          shop: { name: shop },
        }
      }
    } catch (e) {
      // JSON parse failed
    }
  }

  throw new Error("Could not parse Tokopedia product")
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Detect platform dan parse URL
    if (url.includes("shopee")) {
      const parsed = parseShopeeUrl(url)
      if (!parsed) {
        return NextResponse.json({ error: "Invalid Shopee URL format" }, { status: 400 })
      }

      const product = await fetchShopeeProduct(parsed.shopId, parsed.itemId)
      return NextResponse.json({ success: true, data: product })
    }

    if (url.includes("tokopedia")) {
      const parsed = parseTokopediaUrl(url)
      if (!parsed) {
        return NextResponse.json({ error: "Invalid Tokopedia URL format" }, { status: 400 })
      }

      const product = await fetchTokopediaProduct(parsed.shop, parsed.slug)
      return NextResponse.json({ success: true, data: product })
    }

    return NextResponse.json(
      { error: "Unsupported platform. Only Shopee and Tokopedia are supported." },
      { status: 400 },
    )
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 },
    )
  }
}
