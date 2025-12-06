package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

// Page view tracking functions

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
