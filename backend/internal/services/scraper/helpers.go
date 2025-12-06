package scraper

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

// extractMetaContent extracts content from meta property/name/itemprop tags
func (s *Service) extractMetaContent(html, property string) string {
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

// extractProductImage extracts high quality product image from HTML
func (s *Service) extractProductImage(html string) string {
	re := regexp.MustCompile(`src="(https://down-id\.img\.susercontent\.com/file/[^"@]+)"`)
	if matches := re.FindStringSubmatch(html); len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// parseSoldValue parses sold count with suffix (rb, k, etc)
func (s *Service) parseSoldValue(valStr, suffix string) int {
	multiplier := 1.0
	if strings.Contains(strings.ToLower(suffix), "rb") || strings.Contains(strings.ToLower(suffix), "k") {
		multiplier = 1000.0
	}

	valStr = strings.ReplaceAll(valStr, ",", ".")
	var val float64
	fmt.Sscanf(valStr, "%f", &val)
	return int(val * multiplier)
}

// resolveShortLink resolves short links (shp.ee, etc) to full product URLs
func (s *Service) resolveShortLink(shortURL string) (string, error) {
	req, err := http.NewRequest("GET", shortURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "facebookexternalhit/1.1;line-poker/1.0")
	req.Header.Set("Accept", "application/xhtml+xml")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

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
