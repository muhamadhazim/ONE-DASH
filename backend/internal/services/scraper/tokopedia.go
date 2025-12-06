package scraper

import (
	"fmt"
	"html"
	"net/http"
	"regexp"
	"strings"
)

// scrapeTokopedia scrapes product metadata from Tokopedia
func (s *Service) scrapeTokopedia(productURL string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", productURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "tokopedia"}, nil
	}

	// Use Facebook's crawler User-Agent for SSR/SEO-friendly HTML
	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "tokopedia"}, nil
	}
	defer resp.Body.Close()

	// Read HTML response (500KB limit for reviewCount priority)
	bodyBytes := make([]byte, 500000)
	n, _ := resp.Body.Read(bodyBytes)
	responseHTML := string(bodyBytes[:n])

	// Handle tk.tokopedia.com manual redirect
	if strings.Contains(responseHTML, ">Found</a>") || (strings.Contains(productURL, "tk.tokopedia.com") && strings.Contains(responseHTML, "href=")) {
		reRedirect := regexp.MustCompile(`<a\s+href="([^"]+)"[^>]*>Found</a>`)
		if matches := reRedirect.FindStringSubmatch(responseHTML); len(matches) > 1 {
			redirectURL := html.UnescapeString(matches[1])
			if strings.HasPrefix(redirectURL, "/") {
				redirectURL = "https://www.tokopedia.com" + redirectURL
			}
			return s.scrapeTokopedia(redirectURL)
		}
	}

	// Extract Title
	title := s.extractMetaContent(responseHTML, "og:title")
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

	// Detect Category - try BreadcrumbList first, then title fallback
	category := s.extractTokopediaCategory(responseHTML)
	if category == "" || category == "Other" {
		category = s.detectCategory(title)
	}

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

func (s *Service) extractTokopediaPrice(html string) float64 {
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

	// Try "Rp" format
	re = regexp.MustCompile(`Rp([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		return price
	}

	return 0
}

func (s *Service) extractTokopediaRating(html, description string) float64 {
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

// extractTokopediaSold extracts sold count from Tokopedia HTML
func (s *Service) extractTokopediaSold(html, description string) int {
	// Pattern 1: data-testid with sold counter
	reSpecific := regexp.MustCompile(`data-testid="lblPDPDetailProductSoldCounter"[^>]*>[\s\S]*?Terjual[\s\S]*?([\d.,]+)\s*(rb|k|K|\+)?`)
	if matches := reSpecific.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Pattern 2: "Terjual X"
	re1 := regexp.MustCompile(`(?i)Terjual\s*([\d.,]+)\s*(rb|k|K|\+)?`)
	if matches := re1.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Pattern 3: "X terjual"
	re2 := regexp.MustCompile(`(?i)([\d.,]+)\s*(rb|k|K|\+)?\s*terjual`)
	if matches := re2.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Try description text
	if matches := re1.FindStringSubmatch(description); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}
	if matches := re2.FindStringSubmatch(description); len(matches) > 1 {
		return s.parseSoldValue(matches[1], matches[2])
	}

	// Fallback: Use Review Count
	reReview := regexp.MustCompile(`"reviewCount"\s*:\s*"?(\d+)"?`)
	if matches := reReview.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	// Try meta tag
	if val := s.extractMetaContent(html, "reviewCount"); val != "" {
		var count int
		fmt.Sscanf(val, "%d", &count)
		return count
	}

	return 0
}
