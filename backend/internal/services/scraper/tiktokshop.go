package scraper

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
)

// scrapeTikTokShop scrapes product metadata from TikTok Shop using WhatsApp User-Agent
func (s *Service) scrapeTikTokShop(productURL string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", productURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "tiktok_shop"}, nil
	}

	// Use WhatsApp User-Agent for server-side rendered HTML
	// req.Header.Set("User-Agent", "WhatsApp/2.21.4.22 A")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "tiktok_shop"}, nil
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ProductMetadata{Platform: "tiktok_shop"}, nil
	}
	htmlContent := string(bodyBytes)

	// Extract og:title
	title := s.extractMetaContent(htmlContent, `og:title`)
	title = strings.TrimSuffix(title, " - TikTok Shop")

	// Extract og:image
	imageURL := s.extractMetaContent(htmlContent, `og:image`)

	price := s.extractTikTokPrice(htmlContent)
	rating := s.extractTikTokRating(htmlContent)
	sold := s.extractTikTokSold(htmlContent)
	category := s.detectCategory(title)

	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    price,
		Platform: "tiktok_shop",
		Category: category,
		Sold:     sold,
		Rating:   rating,
	}, nil
}

// extractTikTokPrice extracts price from TikTok Shop HTML
func (s *Service) extractTikTokPrice(htmlContent string) float64 {
	// Method 1: JSON-LD price in offers section - "price":345000
	// Look for price after priceCurrency to get the right one
	re := regexp.MustCompile(`"price"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	re = regexp.MustCompile(`"priceCurrency"\s*:\s*"IDR"\s*,\s*"price"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Method 2: Any JSON-LD price pattern

	// Method 3: Price span in HTML - <span>Rp330.000</span>
	re = regexp.MustCompile(`<span>Rp\s*([0-9.,]+)</span>`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return s.parseTikTokPrice(matches[1])
	}

	return 0
}

// parseTikTokPrice converts Indonesian price format to float
func (s *Service) parseTikTokPrice(priceStr string) float64 {
	// Remove dots (thousand separators) and convert comma to dot
	priceStr = strings.ReplaceAll(priceStr, ".", "")
	priceStr = strings.ReplaceAll(priceStr, ",", "")
	var price float64
	fmt.Sscanf(priceStr, "%f", &price)
	return price
}

// extractTikTokRating extracts rating from TikTok Shop HTML
func (s *Service) extractTikTokRating(htmlContent string) float64 {
	// Method 1: JSON-LD aggregateRating ratingValue - "ratingValue":5
	re := regexp.MustCompile(`"aggregateRating"\s*:\s*\{[^}]*"ratingValue"\s*:\s*([0-9.]+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	// Method 2: Any ratingValue pattern
	re = regexp.MustCompile(`"ratingValue"\s*:\s*([0-9.]+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	// Method 3: HTML pattern - <span class="infoRatingScore-*">5</span>
	re = regexp.MustCompile(`infoRatingScore-\w+[^>]*>([0-9.]+)<`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	return 0
}

// extractTikTokSold extracts sold count (uses review count as proxy)
func (s *Service) extractTikTokSold(htmlContent string) int {
	// Method 1: JSON-LD aggregateRating reviewCount - "reviewCount":40
	re := regexp.MustCompile(`"aggregateRating"\s*:\s*\{[^}]*"reviewCount"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	// Method 2: Any reviewCount pattern
	re = regexp.MustCompile(`"reviewCount"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	// Method 3: HTML pattern - <span class="infoRatingCount-*">40</span>
	re = regexp.MustCompile(`infoRatingCount-\w+[^>]*>([0-9]+)<`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	return 0
}
