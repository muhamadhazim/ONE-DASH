package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
)

// GetEstimatedRevenue calculates potential affiliate revenue based on clicks and commission rates
func (r *AnalyticsRepository) GetEstimatedRevenue(userID uuid.UUID, from, to time.Time) (float64, error) {
	// Query that joins link_clicks with links and commission_rates
	// For each click: commission = min(price * rate_percent / 100, max_commission)

	type ClickWithLink struct {
		Price    float64
		Platform string
		Category string
	}

	var clicksData []ClickWithLink

	query := r.db.Table("link_clicks lc").
		Select("l.price, l.platform, l.category").
		Joins("JOIN links l ON lc.link_id = l.id").
		Where("lc.user_id = ?", userID)

	if !from.IsZero() {
		query = query.Where("lc.clicked_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("lc.clicked_at <= ?", to)
	}

	if err := query.Find(&clicksData).Error; err != nil {
		return 0, err
	}

	// Get all commission rates (cache for efficiency)
	var rates []models.CommissionRate
	if err := r.db.Find(&rates).Error; err != nil {
		return 0, err
	}

	// Build rate lookup map: platform_category -> rate
	rateMap := make(map[string]models.CommissionRate)
	for _, rate := range rates {
		key := rate.Platform + "_" + rate.Category
		rateMap[key] = rate
	}

	var totalRevenue float64

	for _, click := range clicksData {
		// Find matching rate
		platform := click.Platform
		category := click.Category
		if category == "" {
			category = "Other"
		}

		// Try exact match first
		key := platform + "_" + category
		rate, found := rateMap[key]

		// Fallback to "Other" category for the platform
		if !found {
			key = platform + "_Other"
			rate, found = rateMap[key]
		}

		// If still not found, use default 2% with no cap
		if !found {
			rate = models.CommissionRate{
				RatePercent:   2.0,
				MaxCommission: nil,
			}
		}

		// Calculate commission
		commission := click.Price * rate.RatePercent / 100

		// Apply max cap if exists
		if rate.MaxCommission != nil && commission > float64(*rate.MaxCommission) {
			commission = float64(*rate.MaxCommission)
		}

		totalRevenue += commission
	}

	return totalRevenue, nil
}
