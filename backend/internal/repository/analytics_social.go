package repository

import (
	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
)

// Social click tracking functions

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
