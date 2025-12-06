package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/onedash/backend/internal/middleware"
	"github.com/onedash/backend/internal/services"
	"github.com/onedash/backend/internal/services/scraper"
)

type LinkHandler struct {
	linkService    *services.LinkService
	scraperService *scraper.Service
}

func NewLinkHandler(linkService *services.LinkService, scraperService *scraper.Service) *LinkHandler {
	return &LinkHandler{
		linkService:    linkService,
		scraperService: scraperService,
	}
}

func (h *LinkHandler) GetLinks(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	links, err := h.linkService.GetLinks(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get links",
		})
	}

	return c.JSON(links)
}

func (h *LinkHandler) CreateLink(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var input services.CreateLinkInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.Title == "" || input.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title and URL are required",
		})
	}

	link, err := h.linkService.CreateLink(userID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(link)
}

func (h *LinkHandler) UpdateLink(c *fiber.Ctx) error {
	linkID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid link ID",
		})
	}

	var input services.UpdateLinkInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	link, err := h.linkService.UpdateLink(linkID, &input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(link)
}

func (h *LinkHandler) DeleteLink(c *fiber.Ctx) error {
	linkID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid link ID",
		})
	}

	if err := h.linkService.DeleteLink(linkID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

func (h *LinkHandler) ReorderLinks(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var input services.ReorderLinksInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.linkService.ReorderLinks(userID, &input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "Links reordered successfully"})
}

// ScrapeProduct scrapes product metadata from a URL
func (h *LinkHandler) ScrapeProduct(c *fiber.Ctx) error {
	var input struct {
		URL string `json:"url"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL is required",
		})
	}

	metadata, err := h.scraperService.ScrapeProduct(input.URL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to scrape product",
			"message": err.Error(),
		})
	}

	return c.JSON(metadata)
}
