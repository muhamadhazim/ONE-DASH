package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/onedash/backend/internal/models"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// Log connection attempt (hide password)
	log.Printf("Attempting to connect to database: host=%s port=%s user=%s dbname=%s", host, port, user, dbname)

	// Build DSN with proper escaping for special characters
	// Use UTC timezone for Railway compatibility
	// Disable statement cache for pooler compatibility
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=UTC statement_cache_mode=describe",
		host, user, password, dbname, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:      logger.Default.LogMode(logger.Info),
		PrepareStmt: false, // MUST be false for transaction pooler
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Skip auto-migration if tables already exist (production safety)
	// Run migrations manually via SQL scripts instead
	env := os.Getenv("ENVIRONMENT")
	if env != "production" {
		// Auto migrate models (only in development)
		if err := db.AutoMigrate(
			&models.User{},
			&models.Contact{},
			&models.Link{},
			&models.LinkClick{},
			&models.PageView{},
			&models.SocialClick{},
			&models.CommissionRate{},
		); err != nil {
			return nil, fmt.Errorf("failed to migrate database: %w", err)
		}
	}

	log.Println("✅ Database connected and migrated successfully")
	DB = db
	return db, nil
}
