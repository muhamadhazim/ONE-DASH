package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
)

// Overview Stats
type OverviewStats struct {
	TotalViews  int64   `json:"total_views"`
	TotalClicks int64   `json:"total_clicks"`
	CVR         float64 `json:"cvr"` // Conversion rate
}

func (r *AnalyticsRepository) GetOverviewStats(userID uuid.UUID, from, to time.Time) (*OverviewStats, error) {
	stats := &OverviewStats{}

	// Get total views
	viewQuery := r.db.Model(&models.PageView{}).Where("user_id = ?", userID)
	if !from.IsZero() {
		viewQuery = viewQuery.Where("viewed_at >= ?", from)
	}
	if !to.IsZero() {
		viewQuery = viewQuery.Where("viewed_at <= ?", to)
	}
	if err := viewQuery.Count(&stats.TotalViews).Error; err != nil {
		return nil, err
	}

	// Get total clicks
	clickQuery := r.db.Model(&models.LinkClick{}).Where("user_id = ?", userID)
	if !from.IsZero() {
		clickQuery = clickQuery.Where("clicked_at >= ?", from)
	}
	if !to.IsZero() {
		clickQuery = clickQuery.Where("clicked_at <= ?", to)
	}
	if err := clickQuery.Count(&stats.TotalClicks).Error; err != nil {
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

// Filtered stats
func (r *AnalyticsRepository) GetFilteredTopLinks(userID uuid.UUID, source, platform, category string, from, to time.Time, limit int) ([]TopLink, error) {
	var topLinks []TopLink

	query := r.db.Table("link_clicks").
		Select("link_clicks.link_id, links.title, COUNT(*) as clicks").
		Joins("JOIN links ON links.id = link_clicks.link_id").
		Where("link_clicks.user_id = ?", userID)

	query = applySourceFilter(query, "link_clicks.source", source)
	query = applyPlatformFilter(query, "link_clicks.platform", platform)
	query = applyCategoryFilter(query, "link_clicks.category", category)
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
	query = applySourceFilter(query, "source", source)
	query = applyPlatformFilter(query, "platform", platform)
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
	query = applySourceFilter(query, "source", source)
	query = applyPlatformFilter(query, "platform", platform)
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
	query = applySourceFilter(query, "source", source)
	query = applyPlatformFilter(query, "platform", platform)
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
	query = applySourceFilter(query, "source", source)
	query = applyPlatformFilter(query, "platform", platform)
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
	query = applySourceFilter(query, "source", source)
	query = applyPlatformFilter(query, "platform", platform)
	query = applyCategoryFilter(query, "category", category)
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
