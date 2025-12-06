package repository

import (
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
