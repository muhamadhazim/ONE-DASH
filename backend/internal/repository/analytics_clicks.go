package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

// Click tracking functions

func (r *AnalyticsRepository) CreateClick(click *models.LinkClick) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Insert click record
		if err := tx.Create(click).Error; err != nil {
			return err
		}
		// 2. Increment user's total_clicks counter
		if err := tx.Model(&models.User{}).
			Where("id = ?", click.UserID).
			Update("total_clicks", gorm.Expr("total_clicks + 1")).Error; err != nil {
			return err
		}
		return nil
	})
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

// CheckClickExists checks if a click already exists (for deduplication)
func (r *AnalyticsRepository) CheckClickExists(visitorID string, linkID uuid.UUID) (bool, error) {
	var count int64
	// Check if click exists in last 3 hours
	err := r.db.Model(&models.LinkClick{}).
		Where("visitor_id = ? AND link_id = ? AND clicked_at > NOW() - INTERVAL '3 hours'", visitorID, linkID).
		Count(&count).Error
	return count > 0, err
}
