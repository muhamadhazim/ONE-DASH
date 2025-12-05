package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/onedash/backend/internal/middleware"
	"github.com/onedash/backend/internal/services"
)

type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

func (h *AnalyticsHandler) GetOverview(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	stats, err := h.analyticsService.GetOverview(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get analytics",
		})
	}

	return c.JSON(stats)
}

func (h *AnalyticsHandler) GetClicks(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Parse date range from query params
	fromStr := c.Query("from", time.Now().AddDate(0, 0, -7).Format("2006-01-02"))
	toStr := c.Query("to", time.Now().Format("2006-01-02"))

	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		from = time.Now().AddDate(0, 0, -7)
	}

	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		to = time.Now()
	}

	clicks, err := h.analyticsService.GetClicks(userID, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get clicks",
		})
	}

	topLinks, err := h.analyticsService.GetTopLinks(userID, 5)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get top links",
		})
	}

	return c.JSON(fiber.Map{
		"clicks":    clicks,
		"top_links": topLinks,
	})
}

// TrackClick - PUBLIC endpoint for tracking product clicks
func (h *AnalyticsHandler) TrackClick(c *fiber.Ctx) error {
	var input struct {
		LinkID    uuid.UUID `json:"link_id"`
		UserID    uuid.UUID `json:"user_id"`
		VisitorID string    `json:"visitor_id"`
		Source    string    `json:"source"`
		Platform  string    `json:"platform"`
		Category  string    `json:"category"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.LinkID == uuid.Nil || input.UserID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Link ID and User ID are required",
		})
	}

	err := h.analyticsService.TrackClick(
		input.LinkID,
		input.UserID,
		input.VisitorID,
		input.Source,
		input.Platform,
		input.Category,
		c.IP(),
		c.Get("User-Agent"),
		c.Get("Referer"),
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to track click",
		})
	}

	return c.JSON(fiber.Map{"message": "Click tracked"})
}

// TrackSocialClick - PUBLIC endpoint for tracking social icon clicks
func (h *AnalyticsHandler) TrackSocialClick(c *fiber.Ctx) error {
	var input struct {
		UserID     uuid.UUID `json:"user_id"`
		VisitorID  string    `json:"visitor_id"`
		Source     string    `json:"source"`
		SocialType string    `json:"social_type"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.UserID == uuid.Nil || input.SocialType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID and social type are required",
		})
	}

	err := h.analyticsService.TrackSocialClick(
		input.UserID,
		input.VisitorID,
		input.Source,
		input.SocialType,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to track social click",
		})
	}

	return c.JSON(fiber.Map{"message": "Social click tracked"})
}

// TrackPageView - PUBLIC endpoint for tracking page views
func (h *AnalyticsHandler) TrackPageView(c *fiber.Ctx) error {
	var input struct {
		UserID    uuid.UUID `json:"user_id"`
		VisitorID string    `json:"visitor_id"`
		Source    string    `json:"source"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.UserID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID is required",
		})
	}

	err := h.analyticsService.TrackPageView(
		input.UserID,
		input.VisitorID,
		input.Source,
		c.IP(),
		c.Get("User-Agent"),
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to track page view",
		})
	}

	return c.JSON(fiber.Map{"message": "Page view tracked"})
}

// GetDashboardStats - PROTECTED endpoint for dashboard
func (h *AnalyticsHandler) GetDashboardStats(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Get filter params
	source := c.Query("source", "all")
	platform := c.Query("platform", "all")
	category := c.Query("category", "all")
	fromStr := c.Query("from", "")
	toStr := c.Query("to", "")

	// Parse date range
	var from, to time.Time
	if fromStr != "" {
		from, _ = time.Parse("2006-01-02", fromStr)
	}
	if toStr != "" {
		to, _ = time.Parse("2006-01-02", toStr)
		// Add 1 day to include the end date fully
		to = to.Add(24 * time.Hour)
	}

	// Get overview stats
	overview, err := h.analyticsService.GetOverview(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get overview",
		})
	}

	// Get top links with filters
	topLinks, err := h.analyticsService.GetFilteredTopLinks(userID, source, platform, category, from, to, 5)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get top links",
		})
	}

	// Get social click stats (for pie chart)
	socialStats, err := h.analyticsService.GetSocialClickStats(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get social stats",
		})
	}

	// Get clicks by source
	clicksBySource, err := h.analyticsService.GetClicksBySource(userID, source, platform, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get clicks by source",
		})
	}

	// Get clicks by platform
	clicksByPlatform, err := h.analyticsService.GetClicksByPlatform(userID, source, platform, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get clicks by platform",
		})
	}

	// Get clicks by category
	clicksByCategory, err := h.analyticsService.GetClicksByCategory(userID, source, platform, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get clicks by category",
		})
	}

	// Get views by source
	viewsBySource, err := h.analyticsService.GetViewsBySource(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get views by source",
		})
	}

	// Get daily clicks for chart
	dailyClicks, err := h.analyticsService.GetDailyClicks(userID, source, platform, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get daily clicks",
		})
	}

	return c.JSON(fiber.Map{
		"overview":           overview,
		"top_links":          topLinks,
		"social_stats":       socialStats,
		"clicks_by_source":   clicksBySource,
		"clicks_by_platform": clicksByPlatform,
		"clicks_by_category": clicksByCategory,
		"views_by_source":    viewsBySource,
		"daily_clicks":       dailyClicks,
	})
}

// GetTimelineChart - PROTECTED endpoint for timeline chart with grouping
func (h *AnalyticsHandler) GetTimelineChart(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Get query params
	timeGroup := c.Query("time_group", "daily") // daily, weekly, monthly
	groupBy := c.Query("group_by", "source")    // source, platform
	source := c.Query("source", "")
	platform := c.Query("platform", "")
	category := c.Query("category", "")
	fromStr := c.Query("from", "")
	toStr := c.Query("to", "")

	// Parse date range
	var from, to time.Time
	if fromStr != "" {
		from, _ = time.Parse("2006-01-02", fromStr)
	}
	if toStr != "" {
		to, _ = time.Parse("2006-01-02", toStr)
		to = to.Add(24 * time.Hour)
	}

	data, err := h.analyticsService.GetTimelineClicksByGroup(userID, timeGroup, groupBy, source, platform, category, from, to)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get timeline data",
		})
	}

	return c.JSON(fiber.Map{
		"data":       data,
		"time_group": timeGroup,
		"group_by":   groupBy,
	})
}
