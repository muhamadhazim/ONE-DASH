package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommissionRate struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Platform      string    `gorm:"size:50;not null;uniqueIndex:idx_platform_category" json:"platform"`
	Category      string    `gorm:"size:100;not null;uniqueIndex:idx_platform_category" json:"category"`
	RatePercent   float64   `gorm:"type:decimal(5,2);not null" json:"rate_percent"`
	MaxCommission *int      `gorm:"default:null" json:"max_commission"` // nullable, in Rupiah
	Notes         string    `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (c *CommissionRate) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
