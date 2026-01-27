package services

import (
	"strings"

	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
	"github.com/onedash/backend/internal/repository"
)

type LinkService struct {
	linkRepo *repository.LinkRepository
}

func NewLinkService(linkRepo *repository.LinkRepository) *LinkService {
	return &LinkService{linkRepo: linkRepo}
}

type CreateLinkInput struct {
	Title         string  `json:"title" validate:"required"`
	Subtitle      string  `json:"subtitle"`
	URL           string  `json:"url" validate:"required"`
	ImageURL      string  `json:"image_url"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
	Discount      string  `json:"discount"`
	Badge         string  `json:"badge"`
	Rating        float64 `json:"rating"`
	Sold          int     `json:"sold"`
	Category      string  `json:"category"`
	Platform      string  `json:"platform"`
	Position      int     `json:"position"`
}

type UpdateLinkInput struct {
	Title         string   `json:"title"`
	Subtitle      string   `json:"subtitle"`
	URL           string   `json:"url"`
	ImageURL      string   `json:"image_url"`
	Price         *float64 `json:"price"`
	OriginalPrice *float64 `json:"original_price"`
	Discount      string   `json:"discount"`
	Badge         string   `json:"badge"`
	Rating        *float64 `json:"rating"`
	Sold          *int     `json:"sold"`
	Category      string   `json:"category"`
	Platform      string   `json:"platform"`
	Position      int      `json:"position"`
	IsActive      *bool    `json:"is_active"`
}

type ReorderLinksInput struct {
	Links []struct {
		ID       uuid.UUID `json:"id"`
		Position int       `json:"position"`
	} `json:"links"`
}

func (s *LinkService) GetLinks(userID uuid.UUID) ([]models.Link, error) {
	return s.linkRepo.FindByUserID(userID)
}

// detectPlatform detects marketplace platform from URL
func detectPlatform(url string) string {
	u := strings.ToLower(url)
	// Check TikTok first because it might contain 'tokopedia' in domain (e.g. vt.tokopedia.com)
	if strings.Contains(u, "tiktok") || strings.Contains(u, "vt.tokopedia.com") || strings.Contains(u, "shop-id.tokopedia.com") {
		return "tiktok_shop"
	}
	if strings.Contains(u, "shopee") || strings.Contains(u, "shp.ee") {
		return "shopee"
	}
	if strings.Contains(u, "tokopedia") || strings.Contains(u, "tokped") {
		return "tokopedia"
	}
	if strings.Contains(u, "lazada") {
		return "lazada"
	}
	if strings.Contains(u, "bukalapak") {
		return "bukalapak"
	}
	if strings.Contains(u, "blibli") {
		return "blibli"
	}
	return "others"
}

func (s *LinkService) CreateLink(userID uuid.UUID, input *CreateLinkInput) (*models.Link, error) {
	// Get current count to set position
	count, _ := s.linkRepo.CountByUserID(userID)

	// Auto-detect platform from URL if not provided
	platform := input.Platform
	if platform == "" {
		platform = detectPlatform(input.URL)
	}

	link := &models.Link{
		UserID:        userID,
		Title:         input.Title,
		Subtitle:      input.Subtitle,
		URL:           input.URL,
		ImageURL:      input.ImageURL,
		Price:         input.Price,
		OriginalPrice: input.OriginalPrice,
		Discount:      input.Discount,
		Badge:         input.Badge,
		Rating:        input.Rating,
		Sold:          input.Sold,
		Category:      input.Category,
		Platform:      platform,
		Position:      int(count),
		IsActive:      true,
	}

	if err := s.linkRepo.Create(link); err != nil {
		return nil, err
	}

	return link, nil
}

func (s *LinkService) UpdateLink(linkID uuid.UUID, input *UpdateLinkInput) (*models.Link, error) {
	link, err := s.linkRepo.FindByID(linkID)
	if err != nil {
		return nil, err
	}

	if input.Title != "" {
		link.Title = input.Title
	}
	if input.Subtitle != "" {
		link.Subtitle = input.Subtitle
	}
	if input.URL != "" {
		link.URL = input.URL
	}
	if input.ImageURL != "" {
		link.ImageURL = input.ImageURL
	}
	if input.Price != nil {
		link.Price = *input.Price
	}
	if input.OriginalPrice != nil {
		link.OriginalPrice = *input.OriginalPrice
	}
	if input.Discount != "" {
		link.Discount = input.Discount
	}
	if input.Badge != "" {
		link.Badge = input.Badge
	}
	if input.Rating != nil {
		link.Rating = *input.Rating
	}
	if input.Sold != nil {
		link.Sold = *input.Sold
	}
	if input.Category != "" {
		link.Category = input.Category
	}
	if input.IsActive != nil {
		link.IsActive = *input.IsActive
	}

	if err := s.linkRepo.Update(link); err != nil {
		return nil, err
	}

	return link, nil
}

func (s *LinkService) DeleteLink(linkID uuid.UUID) error {
	return s.linkRepo.Delete(linkID)
}

func (s *LinkService) ReorderLinks(userID uuid.UUID, input *ReorderLinksInput) error {
	links := make([]models.Link, len(input.Links))
	for i, l := range input.Links {
		links[i] = models.Link{
			ID:       l.ID,
			Position: l.Position,
		}
	}
	return s.linkRepo.UpdatePositions(links)
}
