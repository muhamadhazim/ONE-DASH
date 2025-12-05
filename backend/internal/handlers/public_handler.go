package handlers

import (
	"github.com/gofiber/fiber/v2"

	"github.com/onedash/backend/internal/repository"
	"github.com/onedash/backend/internal/services"
)

type PublicHandler struct {
	userRepo      *repository.UserRepository
	linkRepo      *repository.LinkRepository
	contactRepo   *repository.ContactRepository
	analyticsRepo *repository.AnalyticsRepository
}

func NewPublicHandler(
	userRepo *repository.UserRepository,
	linkRepo *repository.LinkRepository,
	contactRepo *repository.ContactRepository,
	analyticsRepo *repository.AnalyticsRepository,
) *PublicHandler {
	return &PublicHandler{
		userRepo:      userRepo,
		linkRepo:      linkRepo,
		contactRepo:   contactRepo,
		analyticsRepo: analyticsRepo,
	}
}

type PublicProfileResponse struct {
	UserID      string              `json:"user_id"`
	Name        string              `json:"name"`
	Username    string              `json:"username"`
	Location    string              `json:"location"`
	Bio         string              `json:"bio"`
	Avatar      string              `json:"avatar"`
	Banner      string              `json:"banner"`
	BannerColor string              `json:"banner_color"`
	IsVerified  bool                `json:"is_verified"`
	Socials     []SocialResponse    `json:"socials"`
	Links       []LinkResponse      `json:"links"`
	Categories  []string            `json:"categories"`
	Stats       PublicStatsResponse `json:"stats"`
}

type SocialResponse struct {
	Type string `json:"type"`
	URL  string `json:"url"`
}

type LinkResponse struct {
	ID            string  `json:"id"`
	Title         string  `json:"title"`
	Subtitle      string  `json:"subtitle"`
	URL           string  `json:"url"`
	Image         string  `json:"image"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
	Discount      string  `json:"discount"`
	Badge         string  `json:"badge"`
	Rating        float64 `json:"rating"`
	Sold          int     `json:"sold"`
	Category      string  `json:"category"`
}

type PublicStatsResponse struct {
	Products  int     `json:"products"`
	Purchased string  `json:"purchased"`
	Rating    float64 `json:"rating"`
}

func (h *PublicHandler) GetPublicProfile(c *fiber.Ctx) error {
	username := c.Params("username")
	if username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username is required",
		})
	}

	// Get user
	user, err := h.userRepo.FindByUsername(username)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Track page view (visitor tracking will be done client-side)
	analyticsService := services.NewAnalyticsService(h.analyticsRepo, h.linkRepo)
	analyticsService.TrackPageView(user.ID, "", "", c.IP(), c.Get("User-Agent"))

	// Get contacts
	contacts, _ := h.contactRepo.FindByUserID(user.ID)
	socials := make([]SocialResponse, len(contacts))
	for i, contact := range contacts {
		socials[i] = SocialResponse{
			Type: contact.Type,
			URL:  contact.URL,
		}
	}

	// Get active links
	links, _ := h.linkRepo.FindActiveByUserID(user.ID)
	linkResponses := make([]LinkResponse, len(links))
	categoryMap := make(map[string]bool)

	var totalRating float64
	var ratingCount int

	for i, link := range links {
		linkResponses[i] = LinkResponse{
			ID:            link.ID.String(),
			Title:         link.Title,
			Subtitle:      link.Subtitle,
			URL:           link.URL,
			Image:         link.ImageURL,
			Price:         link.Price,
			OriginalPrice: link.OriginalPrice,
			Discount:      link.Discount,
			Badge:         link.Badge,
			Rating:        link.Rating,
			Sold:          link.Sold,
			Category:      link.Category,
		}

		if link.Category != "" {
			categoryMap[link.Category] = true
		}

		if link.Rating > 0 {
			totalRating += link.Rating
			ratingCount++
		}
	}

	// Get unique categories
	categories := make([]string, 0, len(categoryMap))
	for cat := range categoryMap {
		categories = append(categories, cat)
	}

	// Calculate average rating
	avgRating := 0.0
	if ratingCount > 0 {
		avgRating = totalRating / float64(ratingCount)
	}

	// Get click count
	clickCount, _ := h.analyticsRepo.CountClicksByUserID(user.ID)

	response := PublicProfileResponse{
		UserID:      user.ID.String(),
		Name:        user.DisplayName,
		Username:    user.Username,
		Location:    user.Location,
		Bio:         user.Bio,
		Avatar:      user.AvatarURL,
		Banner:      user.BannerURL,
		BannerColor: user.BannerColor,
		IsVerified:  user.IsVerified,
		Socials:     socials,
		Links:       linkResponses,
		Categories:  categories,
		Stats: PublicStatsResponse{
			Products:  len(links),
			Purchased: formatNumber(clickCount),
			Rating:    avgRating,
		},
	}

	return c.JSON(response)
}

func formatNumber(n int64) string {
	if n >= 1000000 {
		return formatFloat(float64(n)/1000000) + "M"
	}
	if n >= 1000 {
		return formatFloat(float64(n)/1000) + "K"
	}
	return formatInt(n)
}

func formatFloat(f float64) string {
	if f == float64(int(f)) {
		return formatInt(int64(f))
	}
	return formatInt(int64(f*10)/10) + "." + formatInt(int64(f*10)%10)
}

func formatInt(n int64) string {
	return string(rune('0' + n%10))
}
