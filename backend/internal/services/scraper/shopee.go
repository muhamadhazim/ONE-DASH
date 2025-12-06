package scraper

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
)

// scrapeShopee scrapes product metadata from Shopee using Facebook User-Agent trick
func (s *Service) scrapeShopee(productURL string) (*ProductMetadata, error) {
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
		pageURL = fmt.Sprintf("https://shopee.co.id/product/%s/%s", shopID, itemID)
	} else {
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
	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "shopee"}, nil
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ProductMetadata{Platform: "shopee"}, nil
	}
	htmlContent := string(bodyBytes)

	// Extract og:title
	title := s.extractMetaContent(htmlContent, `og:title`)
	title = strings.TrimPrefix(title, "Jual ")
	title = strings.Split(title, " | Shopee")[0]

	// Extract og:image
	imageURL := s.extractMetaContent(htmlContent, `og:image`)
	if betterImage := s.extractProductImage(htmlContent); betterImage != "" {
		imageURL = betterImage
	}

	price := s.extractShopeePrice(htmlContent)
	sold := s.extractSold(htmlContent)
	rating := s.extractRating(htmlContent)
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
func (s *Service) extractShopeePrice(htmlContent string) float64 {
	// Method 1: JSON-LD AggregateOffer lowPrice
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

	// Method 3: og:price:amount meta tag
	if priceStr := s.extractMetaContent(htmlContent, "product:price:amount"); priceStr != "" {
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Method 4: Indonesian Rupiah format "Rp25.749.000"
	re = regexp.MustCompile(`Rp\s*([\d.]+)`)
	allMatches := re.FindAllStringSubmatch(htmlContent, -1)
	for _, matches := range allMatches {
		if len(matches) > 1 {
			priceStr := strings.ReplaceAll(matches[1], ".", "")
			var price float64
			fmt.Sscanf(priceStr, "%f", &price)
			if price > 1000 {
				return price
			}
		}
	}

	return s.extractPrice(htmlContent)
}

// extractPrice extracts price from HTML (basic)
func (s *Service) extractPrice(html string) float64 {
	re := regexp.MustCompile(`"price"\s*:\s*"([\d.]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		return price
	}

	re = regexp.MustCompile(`Rp([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		return price
	}

	return 0
}

// extractSold extracts sold count from Shopee HTML
func (s *Service) extractSold(html string) int {
	// Try JSON-LD first
	re := regexp.MustCompile(`"sold"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var sold int
		fmt.Sscanf(matches[1], "%d", &sold)
		return sold
	}

	// Try text pattern: "1.2rb terjual"
	re = regexp.MustCompile(`([\d.,]+)\s*(?:rb|k|K)?\s*(?:\+)?\s*terjual`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		valStr := matches[1]
		multiplier := 1.0
		if strings.Contains(html, "rb") || strings.Contains(html, "k") || strings.Contains(html, "K") {
			multiplier = 1000.0
		}
		valStr = strings.ReplaceAll(valStr, ",", ".")
		var val float64
		fmt.Sscanf(valStr, "%f", &val)
		return int(val * multiplier)
	}

	// Find ALL ratingCount values - the LAST one is the product's
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

// extractRating extracts rating from Shopee HTML
func (s *Service) extractRating(html string) float64 {
	// Find ALL ratingValue - the LAST one is the product's
	re := regexp.MustCompile(`"ratingValue"\s*:\s*"?([\d.]+)"?`)
	allMatches := re.FindAllStringSubmatch(html, -1)
	if len(allMatches) >= 2 {
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

// extractShopeeIDs extracts shop and item IDs from Shopee URL
func (s *Service) extractShopeeIDs(productURL string) (shopID, itemID string, err error) {
	re1 := regexp.MustCompile(`shopee\.co\.id/product/(\d+)/(\d+)`)
	re2 := regexp.MustCompile(`-i\.(\d+)\.(\d+)`)
	re3 := regexp.MustCompile(`\.(\d+)\.(\d+)(?:\?|$)`)
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
