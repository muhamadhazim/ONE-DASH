package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

type LinkRepository struct {
	db *gorm.DB
}

func NewLinkRepository(db *gorm.DB) *LinkRepository {
	return &LinkRepository{db: db}
}

func (r *LinkRepository) Create(link *models.Link) error {
	return r.db.Create(link).Error
}

func (r *LinkRepository) FindByID(id uuid.UUID) (*models.Link, error) {
	var link models.Link
	err := r.db.First(&link, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &link, nil
}

func (r *LinkRepository) FindByUserID(userID uuid.UUID) ([]models.Link, error) {
	var links []models.Link
	err := r.db.Where("user_id = ?", userID).Order("position ASC").Find(&links).Error
	if err != nil {
		return nil, err
	}
	return links, nil
}

func (r *LinkRepository) FindActiveByUserID(userID uuid.UUID) ([]models.Link, error) {
	var links []models.Link
	err := r.db.Where("user_id = ? AND is_active = ?", userID, true).Order("position ASC").Find(&links).Error
	if err != nil {
		return nil, err
	}
	return links, nil
}

func (r *LinkRepository) Update(link *models.Link) error {
	return r.db.Save(link).Error
}

func (r *LinkRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Link{}, "id = ?", id).Error
}

func (r *LinkRepository) UpdatePositions(links []models.Link) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, link := range links {
			if err := tx.Model(&models.Link{}).Where("id = ?", link.ID).Update("position", link.Position).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *LinkRepository) CountByUserID(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Link{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
