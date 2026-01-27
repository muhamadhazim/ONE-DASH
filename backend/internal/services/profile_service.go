package services

import (
	"errors"
	"fmt"
	"os"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

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
	Username        string  `json:"username"`
	Email           string  `json:"email"`
	DisplayName     string  `json:"display_name"`
	Location        string  `json:"location"`
	Bio             string  `json:"bio"`
	BannerColor     string  `json:"banner_color"`
	Theme           string  `json:"theme"`
	AvatarURL       *string `json:"avatar_url"`
	BannerURL       *string `json:"banner_url"`
	CurrentPassword string  `json:"current_password"`
	NewPassword     string  `json:"new_password"`
}

func (s *ProfileService) GetProfile(userID uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *ProfileService) UpdateProfile(userID uuid.UUID, input *UpdateProfileInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	// Handle password change first (if both current and new password provided)
	if input.CurrentPassword != "" && input.NewPassword != "" {
		// Verify current password
		if err := bcrypt.CompareHashAndPassword(
			[]byte(user.PasswordHash),
			[]byte(input.CurrentPassword),
		); err != nil {
			return nil, errors.New("password saat ini salah")
		}

		// Validate new password length
		if len(input.NewPassword) < 6 {
			return nil, errors.New("password baru minimal 6 karakter")
		}

		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword(
			[]byte(input.NewPassword),
			bcrypt.DefaultCost,
		)
		if err != nil {
			return nil, errors.New("failed to hash new password")
		}

		user.PasswordHash = string(hashedPassword)
	}

	// Check if email is being changed
	if input.Email != "" && input.Email != user.Email {
		// Check if new email already exists
		if s.userRepo.ExistsByEmail(input.Email) {
			return nil, fmt.Errorf("email '%s' sudah terdaftar", input.Email)
		}
		user.Email = input.Email
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
	if input.AvatarURL != nil {
		if *input.AvatarURL == "" && user.AvatarURL != "" {
			// Delete old file
			_ = os.Remove("." + user.AvatarURL)
		}
		user.AvatarURL = *input.AvatarURL
	}
	if input.BannerURL != nil {
		if *input.BannerURL == "" && user.BannerURL != "" {
			// Delete old file
			_ = os.Remove("." + user.BannerURL)
		}
		user.BannerURL = *input.BannerURL
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
