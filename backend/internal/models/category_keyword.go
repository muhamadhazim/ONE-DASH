package models

import (
	"time"

	"github.com/google/uuid"
)

type CategoryKeyword struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Category  string    `gorm:"not null;size:50" json:"category"`
	Keyword   string    `gorm:"not null;size:100" json:"keyword"`
	Source    string    `gorm:"not null;size:20;default:'title'" json:"source"` // 'title' or 'breadcrumb'
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (CategoryKeyword) TableName() string {
	return "category_keywords"
}
