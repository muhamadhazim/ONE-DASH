package services

import (
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/onedash/backend/internal/models"
	"github.com/onedash/backend/internal/repository"
)

type AnalyticsService struct {
	analyticsRepo *repository.AnalyticsRepository
	linkRepo      *repository.LinkRepository
}

func NewAnalyticsService(analyticsRepo *repository.AnalyticsRepository, linkRepo *repository.LinkRepository) *AnalyticsService {
	return &AnalyticsService{
		analyticsRepo: analyticsRepo,
		linkRepo:      linkRepo,
	}
}

func (s *AnalyticsService) GetOverview(userID uuid.UUID, from, to time.Time) (*repository.OverviewStats, error) {
	return s.analyticsRepo.GetOverviewStats(userID, from, to)
}

func (s *AnalyticsService) GetClicks(userID uuid.UUID, from, to time.Time) ([]models.LinkClick, error) {
	return s.analyticsRepo.GetClicksByUserID(userID, from, to)
}

func (s *AnalyticsService) GetTopLinks(userID uuid.UUID, limit int) ([]repository.TopLink, error) {
	return s.analyticsRepo.GetTopLinks(userID, limit)
}

// detectPlatformFromURL detects marketplace from URL
func detectPlatformFromURL(url string) string {
	u := strings.ToLower(url)
	if strings.Contains(u, "shopee") || strings.Contains(u, "shp.ee") {
		return "shopee"
	}
	if strings.Contains(u, "tokopedia") || strings.Contains(u, "tokped") {
		return "tokopedia"
	}
	if strings.Contains(u, "lazada") {
		return "lazada"
	}
	if strings.Contains(u, "bukalapak") {
		return "bukalapak"
	}
	if strings.Contains(u, "tiktok") {
		return "tiktok"
	}
	return "others"
}

// TrackClick with deduplication and auto platform detection
func (s *AnalyticsService) TrackClick(linkID, userID uuid.UUID, visitorID, source, platform, category, visitorIP, userAgent, referer string) error {
	// Check for duplicate if visitorID provided
	if visitorID != "" {
		exists, err := s.analyticsRepo.CheckClickExists(visitorID, linkID)
		if err != nil {
			return err
		}
		if exists {
			return nil
		}
	}

	// If platform or category is empty, try to get from link
	if platform == "" || category == "" {
		if link, err := s.linkRepo.FindByID(linkID); err == nil {
			if platform == "" {
				platform = link.Platform
				if platform == "" && link.URL != "" {
					platform = detectPlatformFromURL(link.URL)
				}
			}
			if category == "" {
				category = link.Category
			}
		}
	}

	click := &models.LinkClick{
		LinkID:    &linkID,
		UserID:    userID,
		VisitorID: visitorID,
		Source:    source,
		Platform:  platform,
		Category:  category,
		VisitorIP: visitorIP,
		UserAgent: userAgent,
		Referer:   referer,
	}
	return s.analyticsRepo.CreateClick(click)
}

func (s *AnalyticsService) TrackPageView(userID uuid.UUID, visitorID, source, visitorIP, userAgent string) error {
	// Check for duplicate pageview within 1 hour
	if visitorID != "" {
		exists, err := s.analyticsRepo.CheckPageViewExists(visitorID, userID)
		if err != nil {
			return err
		}
		if exists {
			// Skip tracking if same visitor viewed within last hour
			return nil
		}
	}

	view := &models.PageView{
		UserID:    userID,
		VisitorID: visitorID,
		Source:    source,
		VisitorIP: visitorIP,
		UserAgent: userAgent,
	}
	return s.analyticsRepo.CreatePageView(view)
}

// TrackSocialClick with deduplication
func (s *AnalyticsService) TrackSocialClick(userID uuid.UUID, visitorID, source, socialType string) error {
	if visitorID != "" {
		exists, err := s.analyticsRepo.CheckSocialClickExists(visitorID, userID, socialType)
		if err != nil {
			return err
		}
		if exists {
			return nil
		}
	}

	click := &models.SocialClick{
		UserID:     userID,
		VisitorID:  visitorID,
		Source:     source,
		SocialType: socialType,
	}
	return s.analyticsRepo.CreateSocialClick(click)
}

// Dashboard stats
func (s *AnalyticsService) GetSocialClickStats(userID uuid.UUID) ([]repository.SocialClickStat, error) {
	return s.analyticsRepo.GetSocialClickStats(userID)
}

func (s *AnalyticsService) GetFilteredTopLinks(userID uuid.UUID, source, platform, category string, from, to time.Time, limit int) ([]repository.TopLink, error) {
	return s.analyticsRepo.GetFilteredTopLinks(userID, source, platform, category, from, to, limit)
}

func (s *AnalyticsService) GetClicksBySource(userID uuid.UUID, source, platform string, from, to time.Time) ([]repository.SourceStat, error) {
	return s.analyticsRepo.GetClicksBySource(userID, source, platform, from, to)
}

func (s *AnalyticsService) GetClicksByPlatform(userID uuid.UUID, source, platform string, from, to time.Time) ([]repository.SourceStat, error) {
	return s.analyticsRepo.GetClicksByPlatform(userID, source, platform, from, to)
}

func (s *AnalyticsService) GetClicksByCategory(userID uuid.UUID, source, platform string, from, to time.Time) ([]repository.SourceStat, error) {
	return s.analyticsRepo.GetClicksByCategory(userID, source, platform, from, to)
}

func (s *AnalyticsService) GetViewsBySource(userID uuid.UUID) ([]repository.SourceStat, error) {
	return s.analyticsRepo.GetViewsBySource(userID)
}

func (s *AnalyticsService) GetDailyClicks(userID uuid.UUID, source, platform string, from, to time.Time) ([]repository.DailyStat, error) {
	return s.analyticsRepo.GetDailyClicks(userID, source, platform, from, to)
}

func (s *AnalyticsService) GetTimelineClicksByGroup(userID uuid.UUID, timeGroup, groupBy, source, platform, category string, from, to time.Time) ([]repository.TimelineDataPoint, error) {
	return s.analyticsRepo.GetTimelineClicksByGroup(userID, timeGroup, groupBy, source, platform, category, from, to)
}

func (s *AnalyticsService) GetEstimatedRevenue(userID uuid.UUID, from, to time.Time) (float64, error) {
	return s.analyticsRepo.GetEstimatedRevenue(userID, from, to)
}
