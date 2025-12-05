package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

type AnalyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// Link Clicks
func (r *AnalyticsRepository) CreateClick(click *models.LinkClick) error {
	return r.db.Create(click).Error
}

func (r *AnalyticsRepository) GetClicksByLinkID(linkID uuid.UUID, from, to time.Time) ([]models.LinkClick, error) {
	var clicks []models.LinkClick
	err := r.db.Where("link_id = ? AND clicked_at BETWEEN ? AND ?", linkID, from, to).Find(&clicks).Error
	return clicks, err
}

func (r *AnalyticsRepository) GetClicksByUserID(userID uuid.UUID, from, to time.Time) ([]models.LinkClick, error) {
	var clicks []models.LinkClick
	err := r.db.Where("user_id = ? AND clicked_at BETWEEN ? AND ?", userID, from, to).Find(&clicks).Error
	return clicks, err
}

func (r *AnalyticsRepository) CountClicksByUserID(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.LinkClick{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *AnalyticsRepository) CountClicksByLinkID(linkID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.LinkClick{}).Where("link_id = ?", linkID).Count(&count).Error
	return count, err
}

// Page Views
func (r *AnalyticsRepository) CreatePageView(view *models.PageView) error {
	return r.db.Create(view).Error
}

func (r *AnalyticsRepository) GetPageViewsByUserID(userID uuid.UUID, from, to time.Time) ([]models.PageView, error) {
	var views []models.PageView
	err := r.db.Where("user_id = ? AND viewed_at BETWEEN ? AND ?", userID, from, to).Find(&views).Error
	return views, err
}

func (r *AnalyticsRepository) CountPageViewsByUserID(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.PageView{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

// Overview Stats
type OverviewStats struct {
	TotalViews  int64   `json:"total_views"`
	TotalClicks int64   `json:"total_clicks"`
	CVR         float64 `json:"cvr"` // Conversion rate
}

func (r *AnalyticsRepository) GetOverviewStats(userID uuid.UUID) (*OverviewStats, error) {
	stats := &OverviewStats{}

	// Get total views
	if err := r.db.Model(&models.PageView{}).Where("user_id = ?", userID).Count(&stats.TotalViews).Error; err != nil {
		return nil, err
	}

	// Get total clicks
	if err := r.db.Model(&models.LinkClick{}).Where("user_id = ?", userID).Count(&stats.TotalClicks).Error; err != nil {
		return nil, err
	}

	// Calculate CVR
	if stats.TotalViews > 0 {
		stats.CVR = float64(stats.TotalClicks) / float64(stats.TotalViews) * 100
	}

	return stats, nil
}

// Top Links
type TopLink struct {
	LinkID uuid.UUID `json:"link_id"`
	Title  string    `json:"title"`
	Clicks int64     `json:"clicks"`
}

func (r *AnalyticsRepository) GetTopLinks(userID uuid.UUID, limit int) ([]TopLink, error) {
	var topLinks []TopLink

	err := r.db.Table("link_clicks").
		Select("link_clicks.link_id, links.title, COUNT(*) as clicks").
		Joins("JOIN links ON links.id = link_clicks.link_id").
		Where("link_clicks.user_id = ?", userID).
		Group("link_clicks.link_id, links.title").
		Order("clicks DESC").
		Limit(limit).
		Find(&topLinks).Error

	return topLinks, err
}

// CheckClickExists checks if a click already exists (for deduplication)
func (r *AnalyticsRepository) CheckClickExists(visitorID string, linkID uuid.UUID) (bool, error) {
	var count int64
	// Check if click exists in last 3 hours
	err := r.db.Model(&models.LinkClick{}).
		Where("visitor_id = ? AND link_id = ? AND clicked_at > NOW() - INTERVAL '3 hours'", visitorID, linkID).
		Count(&count).Error
	return count > 0, err
}

// Social Clicks
func (r *AnalyticsRepository) CreateSocialClick(click *models.SocialClick) error {
	return r.db.Create(click).Error
}

func (r *AnalyticsRepository) CheckSocialClickExists(visitorID string, userID uuid.UUID, socialType string) (bool, error) {
	var count int64
	err := r.db.Model(&models.SocialClick{}).
		Where("visitor_id = ? AND user_id = ? AND social_type = ? AND clicked_at > NOW() - INTERVAL '3 hours'", visitorID, userID, socialType).
		Count(&count).Error
	return count > 0, err
}

// SocialClickStat for pie chart
type SocialClickStat struct {
	SocialType string `json:"social_type"`
	Clicks     int64  `json:"clicks"`
}

func (r *AnalyticsRepository) GetSocialClickStats(userID uuid.UUID) ([]SocialClickStat, error) {
	var stats []SocialClickStat
	err := r.db.Model(&models.SocialClick{}).
		Select("social_type, COUNT(*) as clicks").
		Where("user_id = ?", userID).
		Group("social_type").
		Order("clicks DESC").
		Find(&stats).Error
	return stats, err
}

// Filtered stats
func (r *AnalyticsRepository) GetFilteredTopLinks(userID uuid.UUID, source, platform, category string, from, to time.Time, limit int) ([]TopLink, error) {
	var topLinks []TopLink

	query := r.db.Table("link_clicks").
		Select("link_clicks.link_id, links.title, COUNT(*) as clicks").
		Joins("JOIN links ON links.id = link_clicks.link_id").
		Where("link_clicks.user_id = ?", userID)

	if source != "" && source != "all" {
		query = query.Where("link_clicks.source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("link_clicks.platform = ?", platform)
	}
	if category != "" && category != "all" {
		query = query.Where("link_clicks.category = ?", category)
	}
	if !from.IsZero() {
		query = query.Where("link_clicks.clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("link_clicks.clicked_at <= ?", to)
	}

	err := query.Group("link_clicks.link_id, links.title").
		Order("clicks DESC").
		Limit(limit).
		Find(&topLinks).Error

	return topLinks, err
}

// SourceStat for breakdown
type SourceStat struct {
	Source string `json:"source"`
	Count  int64  `json:"count"`
}

func (r *AnalyticsRepository) GetClicksBySource(userID uuid.UUID, source, platform string, from, to time.Time) ([]SourceStat, error) {
	var stats []SourceStat
	query := r.db.Model(&models.LinkClick{}).
		Select("source, COUNT(*) as count").
		Where("user_id = ? AND source != ''", userID)

	// Apply filters
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("platform = ?", platform)
	}
	if !from.IsZero() {
		query = query.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("clicked_at <= ?", to)
	}

	err := query.Group("source").
		Order("count DESC").
		Find(&stats).Error
	return stats, err
}

func (r *AnalyticsRepository) GetClicksByPlatform(userID uuid.UUID, source, platform string, from, to time.Time) ([]SourceStat, error) {
	var stats []SourceStat
	query := r.db.Model(&models.LinkClick{}).
		Select("platform as source, COUNT(*) as count").
		Where("user_id = ? AND platform != ''", userID)

	// Apply filters
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("platform = ?", platform)
	}
	if !from.IsZero() {
		query = query.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("clicked_at <= ?", to)
	}

	err := query.Group("platform").
		Order("count DESC").
		Find(&stats).Error
	return stats, err
}

func (r *AnalyticsRepository) GetClicksByCategory(userID uuid.UUID, source, platform string, from, to time.Time) ([]SourceStat, error) {
	var stats []SourceStat
	query := r.db.Model(&models.LinkClick{}).
		Select("category as source, COUNT(*) as count").
		Where("user_id = ? AND category != ''", userID)

	// Apply filters
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("platform = ?", platform)
	}
	if !from.IsZero() {
		query = query.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("clicked_at <= ?", to)
	}

	err := query.Group("category").
		Order("count DESC").
		Find(&stats).Error
	return stats, err
}

func (r *AnalyticsRepository) GetViewsBySource(userID uuid.UUID) ([]SourceStat, error) {
	var stats []SourceStat
	err := r.db.Model(&models.PageView{}).
		Select("source, COUNT(*) as count").
		Where("user_id = ? AND source != ''", userID).
		Group("source").
		Order("count DESC").
		Find(&stats).Error
	return stats, err
}

// DailyStat for daily clicks chart
type DailyStat struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// GetDailyClicks returns daily click counts with filters
func (r *AnalyticsRepository) GetDailyClicks(userID uuid.UUID, source, platform string, from, to time.Time) ([]DailyStat, error) {
	var stats []DailyStat
	query := r.db.Model(&models.LinkClick{}).
		Select("TO_CHAR(clicked_at, 'YYYY-MM-DD') as date, COUNT(*) as count").
		Where("user_id = ?", userID)

	// Apply filters
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("platform = ?", platform)
	}
	if !from.IsZero() {
		query = query.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("clicked_at <= ?", to)
	}

	err := query.Group("TO_CHAR(clicked_at, 'YYYY-MM-DD')").
		Order("date ASC").
		Find(&stats).Error
	return stats, err
}

// TimelineDataPoint for grouped timeline chart
type TimelineDataPoint struct {
	Date  string `json:"date"`
	Group string `json:"group"`
	Count int64  `json:"count"`
}

// GetTimelineClicksByGroup returns clicks grouped by time period and source/platform
// timeGroup: "daily", "weekly", "monthly"
// groupBy: "source", "platform"
// GetTimelineClicksByGroup returns clicks grouped by time period and source/platform
// timeGroup: "daily", "weekly", "monthly"
// groupBy: "source", "platform"
func (r *AnalyticsRepository) GetTimelineClicksByGroup(userID uuid.UUID, timeGroup, groupBy, source, platform, category string, from, to time.Time) ([]TimelineDataPoint, error) {
	var stats []TimelineDataPoint

	// Determine date format based on time grouping
	var dateFormat string
	switch timeGroup {
	case "weekly":
		dateFormat = "IYYY-IW" // ISO week
	case "monthly":
		dateFormat = "YYYY-MM"
	default: // daily
		dateFormat = "YYYY-MM-DD"
	}

	// Determine grouping column
	groupColumn := "source"
	if groupBy == "platform" {
		groupColumn = "platform"
	}

	query := r.db.Model(&models.LinkClick{}).
		Select("TO_CHAR(clicked_at, '"+dateFormat+"') as date, "+groupColumn+" as \"group\", COUNT(*) as count").
		Where("user_id = ? AND "+groupColumn+" != ''", userID)

	// Apply filters
	if source != "" && source != "all" {
		query = query.Where("source = ?", source)
	}
	if platform != "" && platform != "all" {
		query = query.Where("platform = ?", platform)
	}
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}
	if !from.IsZero() {
		query = query.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("clicked_at <= ?", to)
	}

	err := query.Group("TO_CHAR(clicked_at, '" + dateFormat + "'), " + groupColumn).
		Order("date ASC, \"group\" ASC").
		Find(&stats).Error
	return stats, err
}

// GetEstimatedRevenue calculates potential affiliate revenue based on clicks and commission rates
func (r *AnalyticsRepository) GetEstimatedRevenue(userID uuid.UUID, from, to time.Time) (float64, error) {
	// Query that joins link_clicks with links and commission_rates
	// For each click: commission = min(price * rate_percent / 100, max_commission)

	type ClickWithLink struct {
		Price    float64
		Platform string
		Category string
	}

	var clicksData []ClickWithLink

	query := r.db.Table("link_clicks lc").
		Select("l.price, l.platform, l.category").
		Joins("JOIN links l ON lc.link_id = l.id").
		Where("lc.user_id = ?", userID)

	if !from.IsZero() {
		query = query.Where("lc.clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("lc.clicked_at <= ?", to)
	}

	if err := query.Find(&clicksData).Error; err != nil {
		return 0, err
	}

	// Get all commission rates (cache for efficiency)
	var rates []models.CommissionRate
	if err := r.db.Find(&rates).Error; err != nil {
		return 0, err
	}

	// Build rate lookup map: platform_category -> rate
	rateMap := make(map[string]models.CommissionRate)
	for _, rate := range rates {
		key := rate.Platform + "_" + rate.Category
		rateMap[key] = rate
	}

	var totalRevenue float64

	for _, click := range clicksData {
		// Find matching rate
		platform := click.Platform
		category := click.Category
		if category == "" {
			category = "Other"
		}

		// Try exact match first
		key := platform + "_" + category
		rate, found := rateMap[key]

		// Fallback to "Other" category for the platform
		if !found {
			key = platform + "_Other"
			rate, found = rateMap[key]
		}

		// If still not found, use default 2% with no cap
		if !found {
			rate = models.CommissionRate{
				RatePercent:   2.0,
				MaxCommission: nil,
			}
		}

		// Calculate commission
		commission := click.Price * rate.RatePercent / 100

		// Apply max cap if exists
		if rate.MaxCommission != nil && commission > float64(*rate.MaxCommission) {
			commission = float64(*rate.MaxCommission)
		}

		totalRevenue += commission
	}

	return totalRevenue, nil
}
