package scraper

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
)

// scrapeBlibli scrapes product metadata from Blibli using Facebook User-Agent
func (s *Service) scrapeBlibli(productURL string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", productURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "blibli"}, nil
	}

	// Use Firefox User-Agent (proven 200 OK)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "blibli"}, nil
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ProductMetadata{Platform: "blibli"}, nil
	}
	htmlContent := string(bodyBytes)

	// Try to extract from window.__PRODUCT_DETAIL_INITIAL_STATE__ JSON first
	// This contains the most complete data for Blibli
	if jsonMetadata := s.extractBlibliJSON(htmlContent); jsonMetadata != nil {
		return jsonMetadata, nil
	}

	// Fallback to Meta Tags if JSON extraction fails
	title := s.extractMetaContent(htmlContent, `og:title`)
	imageURL := s.extractMetaContent(htmlContent, `og:image`)
	description := s.extractMetaContent(htmlContent, `og:description`)

	// Extract Sold from description
	// Example: "Terjual 7,4 rb kali. Dapatkan Diskon..."
	sold := s.extractBlibliSold(description)
	category := s.detectCategory(title)

	// Price and Rating are not available in OG tags/meta data for Blibli
	// They are rendered via CSR/secured API
	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    0, // Not available
		Platform: "blibli",
		Category: category,
		Sold:     sold,
		Rating:   0, // Not available
	}, nil
}

// extractBlibliJSON extracts metadata from the large JSON state object
func (s *Service) extractBlibliJSON(html string) *ProductMetadata {
	// Look for: window.__PRODUCT_DETAIL_INITIAL_STATE__ = { ... }
	re := regexp.MustCompile(`window\.__PRODUCT_DETAIL_INITIAL_STATE__\s*=\s*(\{.*?\})\s*;`)
	match := re.FindStringSubmatch(html)
	if len(match) < 2 {
		return nil
	}
	jsonStr := match[1]

	// Extract Title
	title := ""
	reTitle := regexp.MustCompile(`"name"\s*:\s*"([^"]+)"`)
	if m := reTitle.FindStringSubmatch(jsonStr); len(m) > 1 {
		title = m[1]
	}

	// Extract Image (Thumbnail)
	imageURL := ""
	reImage := regexp.MustCompile(`"thumbnail"\s*:\s*"(https://[^"]+)"`)
	if m := reImage.FindStringSubmatch(jsonStr); len(m) > 1 {
		imageURL = m[1]
	}

	// Extract Price (offered price)
	// "price":{"listed":16499000,"listDiscount":32,"offered":11249000,"totalDiscount":32}
	var price float64
	rePrice := regexp.MustCompile(`"offered"\s*:\s*(\d+)`)
	if m := rePrice.FindStringSubmatch(jsonStr); len(m) > 1 {
		fmt.Sscanf(m[1], "%f", &price)
	}

	// Extract Rating (from review object)
	// "review":{"rating":"4,0","count":2694,"decimalRating":"4,9"}
	var rating float64
	reRating := regexp.MustCompile(`"decimalRating"\s*:\s*"([0-9,.]+)"`)
	if m := reRating.FindStringSubmatch(jsonStr); len(m) > 1 {
		val := strings.ReplaceAll(m[1], ",", ".")
		fmt.Sscanf(val, "%f", &rating)
	}

	// Extract Sold (User requested to use Review Count as proxy explicitly)
	// "review":{"rating":"4,0","count":2694...}
	var sold int
	reReviewCount := regexp.MustCompile(`"review"\s*:\s*\{[^}]*"count"\s*:\s*(\d+)`)
	if m := reReviewCount.FindStringSubmatch(jsonStr); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &sold)
	} else {
		// Fallback to sold count if review count not found
		reSold := regexp.MustCompile(`"sold"\s*:\s*(\d+)`)
		if m := reSold.FindStringSubmatch(jsonStr); len(m) > 1 {
			fmt.Sscanf(m[1], "%d", &sold)
		}
	}

	// Determine category
	category := s.detectCategory(title)

	if title == "" {
		return nil
	}

	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    price,
		Platform: "blibli",
		Category: category,
		Sold:     sold,
		Rating:   rating,
	}
}

// extractBlibliSold extracts sold count from description text
func (s *Service) extractBlibliSold(description string) int {
	// Pattern: "Terjual 7,4 rb kali"
	re := regexp.MustCompile(`Terjual\s+([0-9.,]+)\s*(rb|jt|juta|ribu)?\s*kali`)
	if matches := re.FindStringSubmatch(description); len(matches) > 2 {
		valStr := matches[1]
		suffix := matches[2]
		return s.parseSoldValue(valStr, suffix)
	}
	return 0
}
