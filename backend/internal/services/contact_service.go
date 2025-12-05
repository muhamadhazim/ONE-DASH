package services

import (
	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
	"github.com/onedash/backend/internal/repository"
)

type ContactService struct {
	contactRepo *repository.ContactRepository
}

func NewContactService(contactRepo *repository.ContactRepository) *ContactService {
	return &ContactService{contactRepo: contactRepo}
}

type CreateContactInput struct {
	Type     string `json:"type" validate:"required"`
	URL      string `json:"url" validate:"required"`
	Position int    `json:"position"`
}

type UpdateContactInput struct {
	Type     string `json:"type"`
	URL      string `json:"url"`
	Position int    `json:"position"`
}

func (s *ContactService) GetContacts(userID uuid.UUID) ([]models.Contact, error) {
	return s.contactRepo.FindByUserID(userID)
}

func (s *ContactService) CreateContact(userID uuid.UUID, input *CreateContactInput) (*models.Contact, error) {
	contact := &models.Contact{
		UserID:   userID,
		Type:     input.Type,
		URL:      input.URL,
		Position: input.Position,
	}

	if err := s.contactRepo.Create(contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (s *ContactService) UpdateContact(contactID uuid.UUID, input *UpdateContactInput) (*models.Contact, error) {
	contact, err := s.contactRepo.FindByID(contactID)
	if err != nil {
		return nil, err
	}

	if input.Type != "" {
		contact.Type = input.Type
	}
	if input.URL != "" {
		contact.URL = input.URL
	}
	contact.Position = input.Position

	if err := s.contactRepo.Update(contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (s *ContactService) DeleteContact(contactID uuid.UUID) error {
	return s.contactRepo.Delete(contactID)
}
