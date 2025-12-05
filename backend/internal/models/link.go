package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Link struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Title         string    `gorm:"not null;size:255" json:"title"`
	Subtitle      string    `gorm:"size:255" json:"subtitle"`
	URL           string    `gorm:"not null;size:1000" json:"url"`
	ImageURL      string    `gorm:"size:500" json:"image_url"`
	Price         float64   `json:"price"`
	OriginalPrice float64   `json:"original_price"`
	Discount      string    `gorm:"size:10" json:"discount"`
	Badge         string    `gorm:"size:20" json:"badge"` // hot, bestseller, new, limited
	Rating        float64   `gorm:"type:decimal(3,2)" json:"rating"`
	Sold          int       `json:"sold"`
	Category      string    `gorm:"size:50" json:"category"`
	Platform      string    `gorm:"size:50" json:"platform"` // shopee, tokopedia, lazada, etc
	Position      int       `gorm:"default:0" json:"position"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	User   User        `gorm:"foreignKey:UserID" json:"-"`
	Clicks []LinkClick `gorm:"foreignKey:LinkID" json:"-"`
}

func (l *Link) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
