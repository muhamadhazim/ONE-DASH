package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

// Page view tracking functions

// CheckPageViewExists checks if a visitor has viewed this profile recently (within 1 hour)
func (r *AnalyticsRepository) CheckPageViewExists(visitorID string, userID uuid.UUID) (bool, error) {
	if visitorID == "" {
		return false, nil
	}
	
	var count int64
	// Check if same visitor viewed this profile in the last hour
	oneHourAgo := time.Now().Add(-1 * time.Hour)
	err := r.db.Model(&models.PageView{}).
		Where("visitor_id = ? AND user_id = ? AND viewed_at > ?", visitorID, userID, oneHourAgo).
		Count(&count).Error
	
	return count > 0, err
}

func (r *AnalyticsRepository) CreatePageView(view *models.PageView) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Insert page view record
		if err := tx.Create(view).Error; err != nil {
			return err
		}
		// 2. Increment user's total_views counter
		if err := tx.Model(&models.User{}).
			Where("id = ?", view.UserID).
			Update("total_views", gorm.Expr("total_views + 1")).Error; err != nil {
			return err
		}
		return nil
	})
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
