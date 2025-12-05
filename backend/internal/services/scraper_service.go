package services

import (
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

type ScraperService struct {
	client *http.Client
}

func NewScraperService() *ScraperService {
	return &ScraperService{
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type ProductMetadata struct {
	Title         string  `json:"title"`
	ImageURL      string  `json:"image_url"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
	Discount      string  `json:"discount"`
	Rating        float64 `json:"rating"`
	Sold          int     `json:"sold"`
	Platform      string  `json:"platform"`
	Category      string  `json:"category"`
}

// ScrapeProduct scrapes product metadata from URL
func (s *ScraperService) ScrapeProduct(productURL string) (*ProductMetadata, error) {
	platform := s.detectPlatform(productURL)

	// Try TMAPI first if API key is configured (best for Shopee)
	tmapiKey := os.Getenv("TMAPI_KEY")
	if tmapiKey != "" && platform == "shopee" {
		result, err := s.scrapeTMAPI(productURL, tmapiKey)
		if err == nil && result.Title != "" {
			return result, nil
		}
	}

	// Try LinkPreview API if key is configured
	linkPreviewKey := os.Getenv("LINKPREVIEW_KEY")
	if linkPreviewKey != "" {
		result, err := s.scrapeLinkPreview(productURL, linkPreviewKey)
		if err == nil && result.Title != "" {
			return result, nil
		}
	}

	// Fallback: try direct scraping
	switch platform {
	case "shopee":
		return s.scrapeShopee(productURL)
	case "tokopedia":
		return s.scrapeTokopedia(productURL)
	default:
		return s.scrapeGeneric(productURL)
	}
}

func (s *ScraperService) detectPlatform(productURL string) string {
	if strings.Contains(productURL, "shopee.co.id") || strings.Contains(productURL, "shopee.com") || strings.Contains(productURL, "shp.ee") {
		return "shopee"
	}
	// Also detect tk.tokopedia.com short links
	if strings.Contains(productURL, "tokopedia.com") || strings.Contains(productURL, "tk.tokopedia.com") {
		return "tokopedia"
	}
	return "generic"
}

// TMAPI - Professional Shopee API (requires API key from tmapi.top)
func (s *ScraperService) scrapeTMAPI(productURL, apiKey string) (*ProductMetadata, error) {
	// Correct endpoint: POST http://api.tmapi.top/shopee/item_detail_by_url
	apiURL := fmt.Sprintf("http://api.tmapi.top/shopee/item_detail_by_url?apiToken=%s", apiKey)

	// Create request body with the product URL
	bodyData := map[string]string{"url": productURL}
	bodyJSON, err := json.Marshal(bodyData)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(string(bodyJSON)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Code int `json:"code"`
		Data struct {
			Title  string   `json:"title"`
			Images []string `json:"images"`
			Price  struct {
				Min float64 `json:"priceMin"`
				Max float64 `json:"priceMax"`
			} `json:"price"`
			OriginalPrice struct {
				Min float64 `json:"priceMin"`
				Max float64 `json:"priceMax"`
			} `json:"originalPrice"`
			RatingAverage float64 `json:"ratingAverage"`
			Sold          int     `json:"sold"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Code != 200 || result.Data.Title == "" {
		return nil, fmt.Errorf("TMAPI error: %d", result.Code)
	}

	imageURL := ""
	if len(result.Data.Images) > 0 {
		imageURL = result.Data.Images[0]
	}

	price := result.Data.Price.Min
	originalPrice := 0.0
	discount := ""

	if result.Data.OriginalPrice.Min > result.Data.Price.Min {
		originalPrice = result.Data.OriginalPrice.Min
		discountPct := (1 - result.Data.Price.Min/result.Data.OriginalPrice.Min) * 100
		discount = fmt.Sprintf("%.0f%%", discountPct)
	}

	return &ProductMetadata{
		Title:         result.Data.Title,
		ImageURL:      imageURL,
		Price:         price,
		OriginalPrice: originalPrice,
		Discount:      discount,
		Rating:        result.Data.RatingAverage,
		Sold:          result.Data.Sold,
		Platform:      "shopee",
		Category:      "", // TMAPI doesn't provide category easily, let caller detect or leave empty
	}, nil
}

// LinkPreview API - OG tag extraction (free tier: 60 req/hour)
func (s *ScraperService) scrapeLinkPreview(productURL, apiKey string) (*ProductMetadata, error) {
	apiURL := fmt.Sprintf(
		"https://api.linkpreview.net/?key=%s&q=%s",
		apiKey,
		url.QueryEscape(productURL),
	)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Image       string `json:"image"`
		URL         string `json:"url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Title == "" {
		return nil, fmt.Errorf("no data from LinkPreview")
	}

	platform := s.detectPlatform(productURL)

	return &ProductMetadata{
		Title:    result.Title,
		ImageURL: result.Image,
		Platform: platform,
	}, nil
}

// Shopee scraping using Facebook User-Agent trick
// Shopee returns full HTML with OG metadata when it thinks it's a Facebook crawler
func (s *ScraperService) scrapeShopee(productURL string) (*ProductMetadata, error) {
	originalURL := productURL

	// Handle short links (shp.ee, id.shp.ee)
	if strings.Contains(productURL, "shp.ee") {
		resolvedURL, err := s.resolveShortLink(productURL)
		if err == nil && resolvedURL != "" {
			productURL = resolvedURL
		}
	}

	// Try to extract IDs and build canonical URL
	shopID, itemID, err := s.extractShopeeIDs(productURL)

	var pageURL string
	if err == nil {
		// Use canonical product URL format
		pageURL = fmt.Sprintf("https://shopee.co.id/product/%s/%s", shopID, itemID)
	} else {
		// Fallback: use the resolved/original URL directly
		if strings.HasPrefix(productURL, "http") {
			pageURL = productURL
		} else {
			pageURL = originalURL
		}
	}

	req, err := http.NewRequest("GET", pageURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "shopee"}, nil
	}

	// THE MAGIC: Use Facebook's crawler User-Agent
	// Shopee will return full HTML with OG metadata for link previews
	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "shopee"}, nil
	}
	defer resp.Body.Close()

	// Read the HTML response
	bodyBytes := make([]byte, 500000) // 500KB should be enough
	n, _ := resp.Body.Read(bodyBytes)
	htmlContent := string(bodyBytes[:n])

	// Extract og:title
	title := s.extractMetaContent(htmlContent, `og:title`)
	// Clean up the title (remove "Jual " prefix and " | Shopee Indonesia" suffix)
	title = strings.TrimPrefix(title, "Jual ")
	title = strings.Split(title, " | Shopee")[0]

	// Extract og:image
	imageURL := s.extractMetaContent(htmlContent, `og:image`)

	// Try to get higher quality image from srcSet if available
	if betterImage := s.extractProductImage(htmlContent); betterImage != "" {
		imageURL = betterImage
	}

	// Extract price - try multiple methods
	price := s.extractShopeePrice(htmlContent)

	// Extract sold count
	sold := s.extractSold(htmlContent)

	// Extract rating
	rating := s.extractRating(htmlContent)

	// Detect category from title
	category := s.detectCategory(title)

	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    price,
		Platform: "shopee",
		Category: category,
		Sold:     sold,
		Rating:   rating,
	}, nil
}

// extractShopeePrice extracts price from Shopee HTML with multiple patterns
func (s *ScraperService) extractShopeePrice(htmlContent string) float64 {
	// Method 1: JSON-LD AggregateOffer lowPrice (Shopee uses this!)
	re := regexp.MustCompile(`"lowPrice"\s*:\s*"?([\d.]+)"?`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Method 2: JSON-LD regular price
	re = regexp.MustCompile(`"price"\s*:\s*"?([\d.]+)"?`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Method 3: og:price:amount or product:price:amount meta tag
	if priceStr := s.extractMetaContent(htmlContent, "product:price:amount"); priceStr != "" {
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Method 4: Indonesian Rupiah format in text "Rp25.749.000"
	re = regexp.MustCompile(`Rp\s*([\d.]+)`)
	allMatches := re.FindAllStringSubmatch(htmlContent, -1)
	for _, matches := range allMatches {
		if len(matches) > 1 {
			priceStr := strings.ReplaceAll(matches[1], ".", "")
			var price float64
			fmt.Sscanf(priceStr, "%f", &price)
			if price > 1000 { // Valid price should be > 1000 IDR
				return price
			}
		}
	}

	// Method 5: Fallback to basic extractPrice
	return s.extractPrice(htmlContent)
}

// Extract content from meta property tag
// Extract content from meta property tag
func (s *ScraperService) extractMetaContent(html, property string) string {
	// Match: <meta ... property="og:title" content="..."/>
	pattern := fmt.Sprintf(`property="%s"[^>]*content="([^"]*)"`, property)
	re := regexp.MustCompile(pattern)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}
	// Try alternate format: content before property
	pattern = fmt.Sprintf(`content="([^"]*)"[^>]*property="%s"`, property)
	re = regexp.MustCompile(pattern)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}

	// Try itemprop (Schema.org)
	pattern = fmt.Sprintf(`itemprop="%s"[^>]*content="([^"]*)"`, property)
	re = regexp.MustCompile(pattern)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}

	// Try name (Twitter cards, etc)
	pattern = fmt.Sprintf(`name="%s"[^>]*content="([^"]*)"`, property)
	re = regexp.MustCompile(pattern)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}

	return ""
}

// Extract high quality product image from HTML
func (s *ScraperService) extractProductImage(html string) string {
	// Look for image in srcSet with high resolution
	re := regexp.MustCompile(`src="(https://down-id\.img\.susercontent\.com/file/[^"@]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// Extract price from Shopee HTML
func (s *ScraperService) extractPrice(html string) float64 {
	// Try JSON-LD first: "price": "12345.00"
	re := regexp.MustCompile(`"price"\s*:\s*"([\d.]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		return price
	}

	// Try regex for price in text
	re = regexp.MustCompile(`Rp([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		return price
	}

	return 0
}

// Extract sold count from Shopee HTML
func (s *ScraperService) extractSold(html string) int {
	// Try JSON-LD first: "sold": 12345
	re := regexp.MustCompile(`"sold"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var sold int
		fmt.Sscanf(matches[1], "%d", &sold)
		return sold
	}

	// Try text pattern: "1.2rb terjual" or "500+ terjual"
	re = regexp.MustCompile(`([\d.,]+)\s*(?:rb|k|K)?\s*(?:\+)?\s*terjual`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		valStr := matches[1]
		multiplier := 1.0
		if strings.Contains(html, "rb") || strings.Contains(html, "k") || strings.Contains(html, "K") {
			multiplier = 1000.0
		}

		// Replace comma with dot for float parsing if needed (Indonesian format)
		valStr = strings.ReplaceAll(valStr, ",", ".")
		var val float64
		fmt.Sscanf(valStr, "%f", &val)
		return int(val * multiplier)
	}

	// Find ALL ratingCount values - the LAST one is the product's (not seller's)
	re = regexp.MustCompile(`"ratingCount"\s*:\s*"?(\d+)"?`)
	allMatches := re.FindAllStringSubmatch(html, -1)
	if len(allMatches) >= 2 {
		var count int
		fmt.Sscanf(allMatches[len(allMatches)-1][1], "%d", &count)
		return count
	} else if len(allMatches) == 1 {
		var count int
		fmt.Sscanf(allMatches[0][1], "%d", &count)
		return count
	}

	return 0
}

// Extract rating from Shopee HTML
func (s *ScraperService) extractRating(html string) float64 {
	// Find ALL ratingValue - the LAST one is the product's (not seller's)
	// In Shopee's JSON-LD, seller's aggregateRating appears BEFORE product's
	re := regexp.MustCompile(`"ratingValue"\s*:\s*"?([\d.]+)"?`)
	allMatches := re.FindAllStringSubmatch(html, -1)
	if len(allMatches) >= 2 {
		// Use the LAST one (product's rating)
		var rating float64
		fmt.Sscanf(allMatches[len(allMatches)-1][1], "%f", &rating)
		return rating
	} else if len(allMatches) == 1 {
		var rating float64
		fmt.Sscanf(allMatches[0][1], "%f", &rating)
		return rating
	}

	return 0
}

func (s *ScraperService) extractShopeeIDs(productURL string) (shopID, itemID string, err error) {
	// Format 1: shopee.co.id/product/123/456
	re1 := regexp.MustCompile(`shopee\.co\.id/product/(\d+)/(\d+)`)
	// Format 2: -i.123.456 (common in short URLs)
	re2 := regexp.MustCompile(`-i\.(\d+)\.(\d+)`)
	// Format 3: shopee.co.id/xxx-xxx-i.123.456
	re3 := regexp.MustCompile(`\.(\d+)\.(\d+)(?:\?|$)`)
	// Format 4: shop/123/item/456
	re4 := regexp.MustCompile(`shop/(\d+)/item/(\d+)`)

	if matches := re1.FindStringSubmatch(productURL); len(matches) == 3 {
		return matches[1], matches[2], nil
	}
	if matches := re2.FindStringSubmatch(productURL); len(matches) == 3 {
		return matches[1], matches[2], nil
	}
	if matches := re3.FindStringSubmatch(productURL); len(matches) == 3 {
		return matches[1], matches[2], nil
	}
	if matches := re4.FindStringSubmatch(productURL); len(matches) == 3 {
		return matches[1], matches[2], nil
	}

	return "", "", fmt.Errorf("cannot extract Shopee IDs from URL")
}

func (s *ScraperService) scrapeTokopedia(productURL string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", productURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "tokopedia"}, nil
	}

	// Use Facebook's crawler User-Agent to get SSR/SEO-friendly HTML
	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "tokopedia"}, nil
	}
	defer resp.Body.Close()

	// Read the HTML response
	bodyBytes := make([]byte, 500000) // 500KB limit
	n, _ := resp.Body.Read(bodyBytes)
	responseHTML := string(bodyBytes[:n])

	// Handle tk.tokopedia.com manual redirect (when using FB User-Agent)
	// Response is often: <a href="...">Found</a>.
	if strings.Contains(responseHTML, ">Found</a>") || (strings.Contains(productURL, "tk.tokopedia.com") && strings.Contains(responseHTML, "href=")) {
		// Match specifically: <a href="URL">Found</a>
		reRedirect := regexp.MustCompile(`<a\s+href="([^"]+)"[^>]*>Found</a>`)
		if matches := reRedirect.FindStringSubmatch(responseHTML); len(matches) > 1 {
			redirectURL := matches[1]
			// Unescape HTML entities (e.g. &amp; -> &)
			redirectURL = html.UnescapeString(redirectURL)

			// Handle relative URLs if necessary (though usually absolute here)
			if strings.HasPrefix(redirectURL, "/") {
				redirectURL = "https://www.tokopedia.com" + redirectURL
			}
			// Recursive call with the resolved URL
			return s.scrapeTokopedia(redirectURL)
		}
	}

	// Extract Title
	title := s.extractMetaContent(responseHTML, "og:title")
	// Cleanup title
	title = strings.TrimSuffix(title, " | Tokopedia")
	title = strings.TrimPrefix(title, "Jual ")

	// Extract Image
	imageURL := s.extractMetaContent(responseHTML, "og:image")

	// Extract Price
	price := s.extractTokopediaPrice(responseHTML)

	// Extract Description for fallback parsing
	description := s.extractMetaContent(responseHTML, "og:description")

	// Extract Rating
	rating := s.extractTokopediaRating(responseHTML, description)

	// Extract Sold
	sold := s.extractTokopediaSold(responseHTML, description)

	// Detect Category
	category := s.detectCategory(title)

	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    price,
		Platform: "tokopedia",
		Category: category,
		Sold:     sold,
		Rating:   rating,
	}, nil
}

func (s *ScraperService) extractTokopediaPrice(html string) float64 {
	// Try og:price:amount first
	if priceStr := s.extractMetaContent(html, "og:price:amount"); priceStr != "" {
		var price float64
		if _, err := fmt.Sscanf(priceStr, "%f", &price); err == nil {
			return price
		}
	}

	// Try JSON-LD: "price": "12345"
	re := regexp.MustCompile(`"price"\s*:\s*"([\d.]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		return price
	}

	// Try regex for "Rp" format in text
	re = regexp.MustCompile(`Rp([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		return price
	}

	return 0
}

func (s *ScraperService) extractTokopediaRating(html, description string) float64 {
	// Try JSON-LD first
	re := regexp.MustCompile(`"ratingValue"\s*:\s*"?([\d.]+)"?`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	// Try description text: "Rating 4.9"
	re = regexp.MustCompile(`Rating\s*([\d.]+)`)
	if matches := re.FindStringSubmatch(description); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	return 0
}

// Extract sold count from Tokopedia HTML
func (s *ScraperService) extractTokopediaSold(html, description string) int {
	// Pattern 1: Specific data-testid with potential tags/comments
	// Matches: <p ... data-testid="lblPDPDetailProductSoldCounter" ...><span class="main">Terjual</span> <!-- -->1 rb+</p>
	reSpecific := regexp.MustCompile(`data-testid="lblPDPDetailProductSoldCounter"[^>]*>[\s\S]*?Terjual[\s\S]*?([\d.,]+)\s*(rb|k|K|\+)?`)
	if matches := reSpecific.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Pattern 2: "Terjual X" (e.g. Terjual 1 rb+) - Simple text fallback
	re1 := regexp.MustCompile(`(?i)Terjual\s*([\d.,]+)\s*(rb|k|K|\+)?`)
	if matches := re1.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Pattern 3: "X terjual" (e.g. 100+ terjual) - Common in product cards/lists
	re2 := regexp.MustCompile(`(?i)([\d.,]+)\s*(rb|k|K|\+)?\s*terjual`)
	if matches := re2.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Try description text with simple patterns
	if matches := re1.FindStringSubmatch(description); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}
	if matches := re2.FindStringSubmatch(description); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Fallback: Use Review Count if Sold Count is not found (User Request)
	// Try JSON-LD: "reviewCount": 12345
	reReview := regexp.MustCompile(`"reviewCount"\s*:\s*"?(\d+)"?`)
	if matches := reReview.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	// Try meta tag: itemprop="reviewCount" content="12345"
	if val := s.extractMetaContent(html, "reviewCount"); val != "" {
		var count int
		fmt.Sscanf(val, "%d", &count)
		return count
	}

	return 0
}

func (s *ScraperService) parseSoldValue(valStr, suffix string) int {
	multiplier := 1.0
	if strings.Contains(strings.ToLower(suffix), "rb") || strings.Contains(strings.ToLower(suffix), "k") {
		multiplier = 1000.0
	}

	valStr = strings.ReplaceAll(valStr, ",", ".")
	var val float64
	fmt.Sscanf(valStr, "%f", &val)
	return int(val * multiplier)
}

func (s *ScraperService) scrapeGeneric(productURL string) (*ProductMetadata, error) {
	return &ProductMetadata{Platform: "generic"}, nil
}

// detectCategory tries to categorize product based on title keywords
func (s *ScraperService) detectCategory(title string) string {
	title = strings.ToLower(title)

	// Electronics
	if strings.Contains(title, "iphone") || strings.Contains(title, "samsung") ||
		strings.Contains(title, "xiaomi") || strings.Contains(title, "phone") ||
		strings.Contains(title, "laptop") || strings.Contains(title, "headphone") ||
		strings.Contains(title, "earphone") || strings.Contains(title, "airpods") ||
		strings.Contains(title, "macbook") || strings.Contains(title, "tablet") {
		return "Electronics"
	}

	// Fashion
	if strings.Contains(title, "baju") || strings.Contains(title, "kaos") ||
		strings.Contains(title, "celana") || strings.Contains(title, "dress") ||
		strings.Contains(title, "sepatu") || strings.Contains(title, "shoes") ||
		strings.Contains(title, "jacket") || strings.Contains(title, "jaket") ||
		strings.Contains(title, "hoodie") || strings.Contains(title, "fashion") {
		return "Fashion"
	}

	// Beauty
	if strings.Contains(title, "skincare") || strings.Contains(title, "serum") ||
		strings.Contains(title, "makeup") || strings.Contains(title, "lipstick") ||
		strings.Contains(title, "parfum") || strings.Contains(title, "beauty") {
		return "Beauty"
	}

	// Food
	if strings.Contains(title, "makanan") || strings.Contains(title, "snack") ||
		strings.Contains(title, "kopi") || strings.Contains(title, "food") {
		return "Food"
	}

	return "Other"
}

// resolveShortLink resolves Shopee short links (shp.ee) to full product URLs
func (s *ScraperService) resolveShortLink(shortURL string) (string, error) {
	req, err := http.NewRequest("GET", shortURL, nil)
	if err != nil {
		return "", err
	}

	// Use Facebook's crawler User-Agent to get the meta tags
	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Read the HTML response
	bodyBytes := make([]byte, 500000)
	n, _ := resp.Body.Read(bodyBytes)
	html := string(bodyBytes[:n])

	// Try to extract al:web:url first (deep link)
	resolvedURL := s.extractMetaContent(html, "al:web:url")
	if resolvedURL != "" {
		return resolvedURL, nil
	}

	// Fallback to og:url
	resolvedURL = s.extractMetaContent(html, "og:url")
	if resolvedURL != "" {
		return resolvedURL, nil
	}

	return "", fmt.Errorf("could not resolve short link")
}
