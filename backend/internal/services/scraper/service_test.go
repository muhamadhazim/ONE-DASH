package scraper

import (
	"testing"
)

func TestResolveShortLink(t *testing.T) {
	service := NewService(nil)
	shortURL := "https://id.shp.ee/CF2zXom"

	resolvedURL, err := service.resolveShortLink(shortURL)
	if err != nil {
		t.Fatalf("Failed to resolve short link: %v", err)
	}

	t.Logf("Resolved URL: %s", resolvedURL)

	if resolvedURL == "" {
		t.Error("Resolved URL is empty")
	}
}

func TestScrapeShopeeShortLink(t *testing.T) {
	service := NewService(nil)
	shortURL := "https://id.shp.ee/CF2zXom"

	metadata, err := service.ScrapeProduct(shortURL)
	if err != nil {
		t.Fatalf("Failed to scrape product: %v", err)
	}

	t.Logf("Metadata: %+v", metadata)

	if metadata.Title == "" {
		t.Error("Title is empty")
	}
	if metadata.Platform != "shopee" {
		t.Errorf("Expected platform shopee, got %s", metadata.Platform)
	}
}
