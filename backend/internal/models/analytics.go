package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LinkClick tracks clicks on affiliate links
type LinkClick struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	LinkID    *uuid.UUID `gorm:"type:uuid;index" json:"link_id"`          // Nullable - preserved when link deleted
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"` // Owner of the link
	VisitorID string     `gorm:"size:36;index" json:"visitor_id"`         // For deduplication
	Source    string     `gorm:"size:50" json:"source"`                   // utm_source (instagram, tiktok, etc)
	Platform  string     `gorm:"size:50" json:"platform"`                 // shopee, tokopedia, etc
	Category  string     `gorm:"size:50" json:"category"`                 // product category
	VisitorIP string     `gorm:"size:45" json:"visitor_ip"`
	UserAgent string     `gorm:"type:text" json:"user_agent"`
	Referer   string     `gorm:"size:500" json:"referer"`
	ClickedAt time.Time  `gorm:"autoCreateTime" json:"clicked_at"`

	// Relationships - SET NULL when link is deleted to preserve analytics
	Link *Link `gorm:"foreignKey:LinkID;constraint:OnDelete:SET NULL" json:"-"`
	User User  `gorm:"foreignKey:UserID" json:"-"`
}

func (lc *LinkClick) BeforeCreate(tx *gorm.DB) error {
	if lc.ID == uuid.Nil {
		lc.ID = uuid.New()
	}
	return nil
}

// PageView tracks views on public profile pages
type PageView struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"` // Owner of the profile
	VisitorID string    `gorm:"size:36;index" json:"visitor_id"`         // For tracking
	Source    string    `gorm:"size:50" json:"source"`                   // utm_source
	VisitorIP string    `gorm:"size:45" json:"visitor_ip"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	ViewedAt  time.Time `gorm:"autoCreateTime" json:"viewed_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (pv *PageView) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return nil
}

// SocialClick tracks clicks on social media icons
type SocialClick struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"` // Owner of the profile
	VisitorID  string    `gorm:"size:36;index" json:"visitor_id"`
	Source     string    `gorm:"size:50" json:"source"`      // utm_source
	SocialType string    `gorm:"size:50" json:"social_type"` // instagram, tiktok, youtube, etc
	ClickedAt  time.Time `gorm:"autoCreateTime" json:"clicked_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (sc *SocialClick) BeforeCreate(tx *gorm.DB) error {
	if sc.ID == uuid.Nil {
		sc.ID = uuid.New()
	}
	return nil
}
