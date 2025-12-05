package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Username     string    `gorm:"uniqueIndex;not null;size:50" json:"username"`
	PasswordHash string    `gorm:"not null;size:255" json:"-"`
	DisplayName  string    `gorm:"size:100" json:"display_name"`
	Location     string    `gorm:"size:100" json:"location"`
	Bio          string    `gorm:"type:text" json:"bio"`
	AvatarURL    string    `gorm:"size:500" json:"avatar_url"`
	BannerURL    string    `gorm:"size:500" json:"banner_url"`
	BannerColor  string    `gorm:"size:7;default:'#FF6B35'" json:"banner_color"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`

	// Counter columns for fast analytics
	TotalViews  int64 `gorm:"default:0" json:"total_views"`
	TotalClicks int64 `gorm:"default:0" json:"total_clicks"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Contacts []Contact `gorm:"foreignKey:UserID" json:"contacts,omitempty"`
	Links    []Link    `gorm:"foreignKey:UserID" json:"links,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
