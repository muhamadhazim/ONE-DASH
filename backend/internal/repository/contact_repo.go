package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/onedash/backend/internal/models"
)

type ContactRepository struct {
	db *gorm.DB
}

func NewContactRepository(db *gorm.DB) *ContactRepository {
	return &ContactRepository{db: db}
}

func (r *ContactRepository) Create(contact *models.Contact) error {
	return r.db.Create(contact).Error
}

func (r *ContactRepository) FindByID(id uuid.UUID) (*models.Contact, error) {
	var contact models.Contact
	err := r.db.First(&contact, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

func (r *ContactRepository) FindByUserID(userID uuid.UUID) ([]models.Contact, error) {
	var contacts []models.Contact
	err := r.db.Where("user_id = ?", userID).Order("position ASC").Find(&contacts).Error
	if err != nil {
		return nil, err
	}
	return contacts, nil
}

func (r *ContactRepository) Update(contact *models.Contact) error {
	return r.db.Save(contact).Error
}

func (r *ContactRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Contact{}, "id = ?", id).Error
}

func (r *ContactRepository) DeleteByUserID(userID uuid.UUID) error {
	return r.db.Delete(&models.Contact{}, "user_id = ?", userID).Error
}
