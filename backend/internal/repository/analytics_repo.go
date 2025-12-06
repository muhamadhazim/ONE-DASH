package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsRepository handles all analytics-related database operations
type AnalyticsRepository struct {
	db *gorm.DB
}

// NewAnalyticsRepository creates a new analytics repository
func NewAnalyticsRepository(db *gorm.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// FilterParams constructs the common parameters for analytics filtering
type FilterParams struct {
	UserID   uuid.UUID
	Source   string
	Platform string
	Category string
	From     time.Time
	To       time.Time
}

// applyAnalyticsFilters applies all common filters to the query
func applyAnalyticsFilters(query *gorm.DB, params FilterParams, tablePrefix string) *gorm.DB {
	// Handle table prefix if provided (e.g. "link_clicks.")
	sourceCol := "source"
	platformCol := "platform"
	categoryCol := "category"
	dateCol := "clicked_at"

	if tablePrefix != "" {
		sourceCol = tablePrefix + sourceCol
		platformCol = tablePrefix + platformCol
		categoryCol = tablePrefix + categoryCol
		dateCol = tablePrefix + dateCol
	}

	query = query.Where(tablePrefix+"user_id = ?", params.UserID)
	query = applySourceFilter(query, sourceCol, params.Source)
	query = applyPlatformFilter(query, platformCol, params.Platform)
	query = applyCategoryFilter(query, categoryCol, params.Category)

	if !params.From.IsZero() {
		query = query.Where(dateCol+" >= ?", params.From)
	}
	if !params.To.IsZero() {
		query = query.Where(dateCol+" <= ?", params.To)
	}
	return query
}

// Known values for "others" filter
var (
	knownSources    = []string{"instagram", "tiktok", "whatsapp", "facebook", "twitter", "youtube"}
	knownPlatforms  = []string{"shopee", "tokopedia", "lazada", "tiktok_shop", "blibli"}
	knownCategories = []string{"Fashion", "Electronics", "Beauty", "Home", "Food"}
)

// applySourceFilter adds source filter with "others" support
func applySourceFilter(query *gorm.DB, column, source string) *gorm.DB {
	if source == "" || source == "all" {
		return query
	}
	if source == "others" {
		return query.Where(column+" NOT IN ? OR "+column+" = 'direct' OR "+column+" = ''", knownSources)
	}
	return query.Where(column+" = ?", source)
}

// applyPlatformFilter adds platform filter with "others" support
func applyPlatformFilter(query *gorm.DB, column, platform string) *gorm.DB {
	if platform == "" || platform == "all" {
		return query
	}
	if platform == "others" {
		return query.Where(column+" NOT IN ? OR "+column+" = ''", knownPlatforms)
	}
	return query.Where(column+" = ?", platform)
}

// applyCategoryFilter adds category filter with "others" support
func applyCategoryFilter(query *gorm.DB, column, category string) *gorm.DB {
	if category == "" || category == "all" {
		return query
	}
	if category == "Others" {
		return query.Where(column+" NOT IN ? OR "+column+" = ''", knownCategories)
	}
	return query.Where(column+" = ?", category)
}
