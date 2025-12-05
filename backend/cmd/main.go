package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"github.com/onedash/backend/config"
	"github.com/onedash/backend/internal/handlers"
	"github.com/onedash/backend/internal/middleware"
	"github.com/onedash/backend/internal/repository"
	"github.com/onedash/backend/internal/services"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	db, err := config.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	contactRepo := repository.NewContactRepository(db)
	linkRepo := repository.NewLinkRepository(db)
	analyticsRepo := repository.NewAnalyticsRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo)
	profileService := services.NewProfileService(userRepo)
	contactService := services.NewContactService(contactRepo)
	linkService := services.NewLinkService(linkRepo)
	scraperService := services.NewScraperService()
	analyticsService := services.NewAnalyticsService(analyticsRepo, linkRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	profileHandler := handlers.NewProfileHandler(profileService)
	contactHandler := handlers.NewContactHandler(contactService)
	linkHandler := handlers.NewLinkHandler(linkService, scraperService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	publicHandler := handlers.NewPublicHandler(userRepo, linkRepo, contactRepo, analyticsRepo)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("CORS_ORIGINS"),
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// API routes
	api := app.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)

	// Public routes (no auth required) - MUST be before protected routes
	api.Get("/u/:username", publicHandler.GetPublicProfile)
	api.Post("/analytics/track", analyticsHandler.TrackClick)
	api.Post("/analytics/social", analyticsHandler.TrackSocialClick)
	api.Post("/analytics/pageview", analyticsHandler.TrackPageView)

	// Protected routes
	protected := api.Group("/", middleware.AuthMiddleware())

	// Profile routes
	protected.Get("profile", profileHandler.GetProfile)
	protected.Put("profile", profileHandler.UpdateProfile)
	protected.Post("profile/avatar", profileHandler.UploadAvatar)
	protected.Post("profile/banner", profileHandler.UploadBanner)
	protected.Post("profile/background", profileHandler.UploadBackgroundImage)

	// Contacts routes
	protected.Get("contacts", contactHandler.GetContacts)
	protected.Post("contacts", contactHandler.CreateContact)
	protected.Put("contacts/:id", contactHandler.UpdateContact)
	protected.Delete("contacts/:id", contactHandler.DeleteContact)

	// Links routes
	protected.Get("links", linkHandler.GetLinks)
	protected.Post("links", linkHandler.CreateLink)
	protected.Put("links/:id", linkHandler.UpdateLink)
	protected.Delete("links/:id", linkHandler.DeleteLink)
	protected.Post("links/reorder", linkHandler.ReorderLinks)
	protected.Post("links/scrape", linkHandler.ScrapeProduct)

	// Analytics routes
	protected.Get("analytics/overview", analyticsHandler.GetOverview)
	protected.Get("analytics/clicks", analyticsHandler.GetClicks)
	protected.Get("analytics/dashboard", analyticsHandler.GetDashboardStats)
	protected.Get("analytics/timeline", analyticsHandler.GetTimelineChart)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Static file serving for uploads
	app.Static("/uploads", "./uploads")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
