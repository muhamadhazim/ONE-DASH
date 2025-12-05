package services

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
	"github.com/onedash/backend/internal/repository"
)

type ProfileService struct {
	userRepo *repository.UserRepository
}

func NewProfileService(userRepo *repository.UserRepository) *ProfileService {
	return &ProfileService{userRepo: userRepo}
}

type UpdateProfileInput struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Location    string `json:"location"`
	Bio         string `json:"bio"`
	BannerColor string `json:"banner_color"`
	Theme       string `json:"theme"`
}

func (s *ProfileService) GetProfile(userID uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *ProfileService) UpdateProfile(userID uuid.UUID, input *UpdateProfileInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	// Check if username is being changed
	if input.Username != "" && input.Username != user.Username {
		// Check if new username already exists
		existingUser, err := s.userRepo.FindByUsername(input.Username)
		if err == nil && existingUser.ID != userID {
			return nil, fmt.Errorf("username '%s' sudah digunakan", input.Username)
		}
		user.Username = input.Username
	}

	if input.DisplayName != "" {
		user.DisplayName = input.DisplayName
	}
	if input.Location != "" {
		user.Location = input.Location
	}
	if input.Bio != "" {
		user.Bio = input.Bio
	}
	if input.BannerColor != "" {
		user.BannerColor = input.BannerColor
	}
	if input.Theme != "" {
		user.Theme = input.Theme
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *ProfileService) UpdateAvatar(userID uuid.UUID, avatarURL string) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	user.AvatarURL = avatarURL
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *ProfileService) UpdateBanner(userID uuid.UUID, bannerURL string) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	user.BannerURL = bannerURL
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}
