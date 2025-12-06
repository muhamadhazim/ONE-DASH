package scraper

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strings"
)

// scrapeLazada scrapes product metadata from Lazada
func (s *Service) scrapeLazada(productURL string) (*ProductMetadata, error) {
	originalURL := productURL

	// For shortlinks, first get the page to extract canonical URL
	if strings.Contains(productURL, "s.lazada") {
		resolvedURL, err := s.resolveLazadaShortLink(productURL)
		if err == nil && resolvedURL != "" {
			productURL = resolvedURL
		}
	}

	req, err := http.NewRequest("GET", productURL, nil)
	if err != nil {
		return &ProductMetadata{Platform: "lazada"}, nil
	}

	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return &ProductMetadata{Platform: "lazada"}, nil
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ProductMetadata{Platform: "lazada"}, nil
	}
	htmlContent := string(bodyBytes)

	// If this is still a shortlink page with redirect, extract the full URL
	if strings.Contains(htmlContent, "rel=\"origin\"") {
		re := regexp.MustCompile(`rel="origin"\s+href="([^"]+)"`)
		if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
			fullURL := html.UnescapeString(matches[1])
			return s.scrapeLazada(fullURL)
		}
	}

	// Extract og:title
	title := s.extractMetaContent(htmlContent, "og:title")
	title = strings.TrimSuffix(title, " | Lazada Indonesia")
	title = html.UnescapeString(title)

	// Extract og:image
	imageURL := s.extractMetaContent(htmlContent, "og:image")

	// Extract data
	price := s.extractLazadaPrice(htmlContent)
	rating := s.extractLazadaRating(htmlContent)
	sold := s.extractLazadaSold(htmlContent)
	category := s.detectCategory(title)

	// Fallback: Try to extract from __moduleData__ if rating or sold is missing
	if rating == 0 || sold == 0 {
		mRating, mSold := s.extractLazadaModuleData(htmlContent)
		if rating == 0 {
			rating = mRating
		}
		if sold == 0 {
			sold = mSold
		}
	}

	// If we got no data, or missing rating/sold, try with Desktop User-Agent
	if title == "" || rating == 0 || sold == 0 {
		req2, _ := http.NewRequest("GET", originalURL, nil)
		// Use Desktop User-Agent to get full page content
		req2.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		req2.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
		req2.Header.Set("Accept-Language", "en-US,en;q=0.5")

		resp2, err2 := s.client.Do(req2)
		if err2 == nil {
			defer resp2.Body.Close()
			bodyBytes2, _ := io.ReadAll(resp2.Body) // Read full body
			htmlContent2 := string(bodyBytes2)

			// Extract only if we missed them before
			if title == "" {
				title = s.extractMetaContent(htmlContent2, "og:title")
				title = strings.TrimSuffix(title, " | Lazada Indonesia")
				title = html.UnescapeString(title)
			}
			if imageURL == "" {
				imageURL = s.extractMetaContent(htmlContent2, "og:image")
			}
			if price == 0 {
				price = s.extractLazadaPrice(htmlContent2)
			}
			if rating == 0 {
				rating = s.extractLazadaRating(htmlContent2)
			}
			if sold == 0 {
				sold = s.extractLazadaSold(htmlContent2)
			}

			// Try module extraction if still missing
			if rating == 0 || sold == 0 {
				mRating, mSold := s.extractLazadaModuleData(htmlContent2)
				if rating == 0 {
					rating = mRating
				}
				if sold == 0 {
					sold = mSold
				}
			}

			if category == "" {
				category = s.detectCategory(title)
			}
		}
	}

	return &ProductMetadata{
		Title:    title,
		ImageURL: imageURL,
		Price:    price,
		Platform: "lazada",
		Category: category,
		Sold:     sold,
		Rating:   rating,
	}, nil
}

// resolveLazadaShortLink extracts the full URL from Lazada short link page
func (s *Service) resolveLazadaShortLink(shortURL string) (string, error) {
	req, err := http.NewRequest("GET", shortURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes := make([]byte, 500000)
	n, _ := resp.Body.Read(bodyBytes)
	htmlContent := string(bodyBytes[:n])

	// Try rel="origin" first
	re := regexp.MustCompile(`rel="origin"\s+href="([^"]+)"`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return html.UnescapeString(matches[1]), nil
	}

	// Try REDIRECTURL in JavaScript
	re = regexp.MustCompile(`REDIRECTURL\s*=\s*new\s+URL\(['"]([^'"]+)['"]\)`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return html.UnescapeString(matches[1]), nil
	}

	// Try setTimeout redirect URL
	re = regexp.MustCompile(`setTimeout\("window\.location\.href\s*=\s*'([^']+)'`)
	if matches := re.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return html.UnescapeString(matches[1]), nil
	}

	return "", fmt.Errorf("could not resolve Lazada short link")
}

func (s *Service) extractLazadaPrice(html string) float64 {
	// Try og:price:amount
	if priceStr := s.extractMetaContent(html, "og:price:amount"); priceStr != "" {
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Try JSON-LD lowPrice
	re := regexp.MustCompile(`"lowPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Try JSON-LD price
	re = regexp.MustCompile(`"price"\s*:\s*"?(\d+(?:\.\d+)?)"?`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var price float64
		fmt.Sscanf(matches[1], "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Try pdpTrackingData pdt_price
	re = regexp.MustCompile(`"pdt_price"\s*:\s*"Rp\s*([\d.]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		if price > 0 {
			return price
		}
	}

	// Try Rp format
	re = regexp.MustCompile(`Rp\s*([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		priceStr := strings.ReplaceAll(matches[1], ".", "")
		var price float64
		fmt.Sscanf(priceStr, "%f", &price)
		return price
	}

	return 0
}

func (s *Service) extractLazadaRating(html string) float64 {
	// Try container-star-v2-score
	re := regexp.MustCompile(`class="container-star-v2-score">([\d.]+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		if rating > 0 && rating <= 5 {
			return rating
		}
	}

	// Try averageRating
	re = regexp.MustCompile(`"averageRating"\s*:\s*(\d+(?:\.\d+)?)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		if rating > 0 && rating <= 5 {
			return rating
		}
	}

	// Try score
	re = regexp.MustCompile(`"score"\s*:\s*(\d+(?:\.\d+)?)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		if rating > 0 && rating <= 5 {
			return rating
		}
	}

	// Try ratingValue
	re = regexp.MustCompile(`"ratingValue"\s*:\s*"?(\d+(?:\.\d+)?)"?`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var rating float64
		fmt.Sscanf(matches[1], "%f", &rating)
		return rating
	}

	return 0
}

func (s *Service) extractLazadaSold(html string) int {
	// Try container-star-v2-count
	re := regexp.MustCompile(`class="container-star-v2-count">[^0-9]*(\d+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		if count > 0 {
			return count
		}
	}

	// Try reviews
	re = regexp.MustCompile(`"reviews"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		if count > 0 {
			return count
		}
	}

	// Try total
	re = regexp.MustCompile(`"total"\s*:\s*(\d+)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		if count > 0 {
			return count
		}
	}

	// Try reviewCount
	re = regexp.MustCompile(`"reviewCount"\s*:\s*"?(\d+)"?`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		var count int
		fmt.Sscanf(matches[1], "%d", &count)
		return count
	}

	// Try X sold/terjual pattern
	re = regexp.MustCompile(`(\d+(?:\.\d+)?)\s*(?:k|K|rb)?\s*(?:sold|terjual)`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return s.parseSoldValue(matches[1], "")
	}

	return 0
}

func (s *Service) extractLazadaModuleData(html string) (float64, int) {
	// Regex to find: app.run(__moduleData__, ...
	// Matches `__moduleData__ = { ... };` or passed in app.run
	re := regexp.MustCompile(`(?s)__moduleData__\s*=\s*(\{.*?\});`)
	matches := re.FindStringSubmatch(html)

	if len(matches) < 2 {
		return 0, 0
	}

	jsonStr := matches[1]
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return 0, 0
	}

	var rating float64
	var sold int

	// Traverse: data -> root -> fields -> (review or rating)
	if d, ok := data["data"].(map[string]interface{}); ok {
		if root, ok := d["root"].(map[string]interface{}); ok {
			if fields, ok := root["fields"].(map[string]interface{}); ok {

				// Try rating from "review" structure
				if review, ok := fields["review"].(map[string]interface{}); ok {
					if val, ok := review["averageRating"].(float64); ok {
						rating = val
					} else if valStr, ok := review["averageRating"].(string); ok {
						fmt.Sscanf(valStr, "%f", &rating)
					}
				}

				// Try rating from "rating" structure
				if rating == 0 {
					if rObj, ok := fields["rating"].(map[string]interface{}); ok {
						if val, ok := rObj["averageRating"].(float64); ok {
							rating = val
						}
					}
				}

				// Try sold/reviews count
				if review, ok := fields["review"].(map[string]interface{}); ok {
					if total, ok := review["total"].(float64); ok {
						sold = int(total)
					} else if totalStr, ok := review["total"].(string); ok {
						fmt.Sscanf(totalStr, "%d", &sold)
					}
				}
			}
		}
	}

	return rating, sold
}
