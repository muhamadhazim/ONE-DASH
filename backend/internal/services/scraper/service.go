package scraper

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/onedash/backend/internal/models"

	"gorm.io/gorm"
)

// Service handles product scraping from various marketplace platforms
type Service struct {
	client          *http.Client
	db              *gorm.DB
	keywordCache    map[string][]string // category -> keywords (source=title)
	breadcrumbCache map[string][]string // category -> keywords (source=breadcrumb)
	cacheMutex      sync.RWMutex
}

// ProductMetadata contains scraped product information
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

// NewService creates a new scraper service
func NewService(db *gorm.DB) *Service {
	s := &Service{
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
		db:              db,
		keywordCache:    make(map[string][]string),
		breadcrumbCache: make(map[string][]string),
	}
	// Load keywords from database on startup
	s.LoadCategoryKeywords()
	return s
}

// LoadCategoryKeywords loads keywords from database into memory cache
func (s *Service) LoadCategoryKeywords() {
	if s.db == nil {
		return
	}

	var keywords []models.CategoryKeyword
	if err := s.db.Find(&keywords).Error; err != nil {
		return
	}

	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	// Clear existing cache
	s.keywordCache = make(map[string][]string)
	s.breadcrumbCache = make(map[string][]string)

	for _, kw := range keywords {
		if kw.Source == "breadcrumb" {
			s.breadcrumbCache[kw.Category] = append(s.breadcrumbCache[kw.Category], strings.ToLower(kw.Keyword))
		} else {
			s.keywordCache[kw.Category] = append(s.keywordCache[kw.Category], strings.ToLower(kw.Keyword))
		}
	}
}

// ScrapeProduct scrapes product metadata from URL using direct scraping
func (s *Service) ScrapeProduct(productURL string) (*ProductMetadata, error) {
	platform := s.detectPlatform(productURL)

	switch platform {
	case "shopee":
		return s.scrapeShopee(productURL)
	case "tokopedia":
		return s.scrapeTokopedia(productURL)
	case "lazada":
		return s.scrapeLazada(productURL)
	case "tiktokshop":
		return s.scrapeTikTokShop(productURL)
	case "blibli":
		return s.scrapeBlibli(productURL)
	default:
		return s.scrapeGeneric(productURL)
	}
}

func (s *Service) detectPlatform(productURL string) string {
	if strings.Contains(productURL, "tiktok.com") || strings.Contains(productURL, "shop.tiktok") || strings.Contains(productURL, "shop-id.tokopedia.com") || strings.Contains(productURL, "vt.tokopedia.com") {
		return "tiktokshop"
	}
	if strings.Contains(productURL, "blibli.com") || strings.Contains(productURL, "blibli.onelink.me") {
		return "blibli"
	}
	if strings.Contains(productURL, "shopee.co.id") || strings.Contains(productURL, "shopee.com") || strings.Contains(productURL, "shp.ee") {
		return "shopee"
	}
	if strings.Contains(productURL, "tokopedia.com") || strings.Contains(productURL, "tk.tokopedia.com") {
		return "tokopedia"
	}
	if strings.Contains(productURL, "lazada.co.id") || strings.Contains(productURL, "lazada.com") || strings.Contains(productURL, "s.lazada.co.id") {
		return "lazada"
	}
	return "generic"
}

func (s *Service) scrapeGeneric(productURL string) (*ProductMetadata, error) {
	return &ProductMetadata{Platform: "generic"}, nil
}
