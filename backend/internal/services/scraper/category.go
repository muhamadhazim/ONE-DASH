package scraper

import (
	"regexp"
	"strings"
)

// detectCategory categorizes product based on title keywords from database
func (s *Service) detectCategory(title string) string {
	title = strings.ToLower(title)

	s.cacheMutex.RLock()
	keywordCache := s.keywordCache
	s.cacheMutex.RUnlock()

	// Check each category's keywords from database
	for category, keywords := range keywordCache {
		for _, keyword := range keywords {
			if strings.Contains(title, keyword) {
				return category
			}
		}
	}

	return "Other"
}

// extractTokopediaCategory extracts category from BreadcrumbList JSON-LD
func (s *Service) extractTokopediaCategory(html string) string {
	// Try to find category names in BreadcrumbList
	// Pattern: "name": "Audio, Kamera & Elektronik Lainnya" or "name": "Speaker"
	re := regexp.MustCompile(`"name"\s*:\s*"([^"]+)"`)
	allMatches := re.FindAllStringSubmatch(html, -1)

	s.cacheMutex.RLock()
	breadcrumbCache := s.breadcrumbCache
	s.cacheMutex.RUnlock()

	for _, matches := range allMatches {
		if len(matches) > 1 {
			name := strings.ToLower(matches[1])

			// Check each category's breadcrumb keywords from database
			for category, keywords := range breadcrumbCache {
				for _, keyword := range keywords {
					if strings.Contains(name, keyword) {
						return category
					}
				}
			}
		}
	}

	return ""
}
