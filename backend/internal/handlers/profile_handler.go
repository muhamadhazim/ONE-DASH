package handlers

import (
	"github.com/gofiber/fiber/v2"

	"github.com/onedash/backend/internal/middleware"
	"github.com/onedash/backend/internal/services"
)

type ProfileHandler struct {
	profileService *services.ProfileService
}

func NewProfileHandler(profileService *services.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: profileService}
}

func (h *ProfileHandler) GetProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	profile, err := h.profileService.GetProfile(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Profile not found",
		})
	}

	return c.JSON(profile)
}

func (h *ProfileHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var input services.UpdateProfileInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	profile, err := h.profileService.UpdateProfile(userID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(profile)
}

func (h *ProfileHandler) UploadAvatar(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Get file from form
	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Avatar file is required",
		})
	}

	// Save file to uploads folder
	filename := userID.String() + "_avatar_" + file.Filename
	uploadPath := "./uploads/avatars/" + filename

	if err := c.SaveFile(file, uploadPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save avatar",
		})
	}

	// Update user avatar URL
	avatarURL := "/uploads/avatars/" + filename
	profile, err := h.profileService.UpdateAvatar(userID, avatarURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(profile)
}

func (h *ProfileHandler) UploadBanner(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Get file from form
	file, err := c.FormFile("banner")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Banner file is required",
		})
	}

	// Save file to uploads folder
	filename := userID.String() + "_banner_" + file.Filename
	uploadPath := "./uploads/banners/" + filename

	if err := c.SaveFile(file, uploadPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save banner",
		})
	}

	// Update user banner URL
	bannerURL := "/uploads/banners/" + filename
	profile, err := h.profileService.UpdateBanner(userID, bannerURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(profile)
}

func (h *ProfileHandler) UploadBackgroundImage(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	// Get file from form
	file, err := c.FormFile("background")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Background image file is required",
		})
	}

	// Save file to uploads folder
	filename := userID.String() + "_bg_" + file.Filename
	uploadPath := "./uploads/backgrounds/" + filename

	if err := c.SaveFile(file, uploadPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save background image",
		})
	}

	// Update user background image URL
	imageURL := "/uploads/backgrounds/" + filename
	profile, err := h.profileService.UpdateBackgroundImage(userID, imageURL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(profile)
}
