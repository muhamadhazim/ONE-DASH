-- ONE-DASH Performance Indexes
-- Jalankan query ini di database PostgreSQL untuk mempercepat dashboard
-- AMAN: Tidak mengubah data, hanya menambah index

-- =====================================================
-- LINK_CLICKS - Mempercepat analytics dashboard
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_link_clicks_user_time 
ON link_clicks(user_id, clicked_at);

CREATE INDEX IF NOT EXISTS idx_link_clicks_visitor 
ON link_clicks(visitor_id);

CREATE INDEX IF NOT EXISTS idx_link_clicks_link 
ON link_clicks(link_id);

-- =====================================================
-- PAGE_VIEWS - Mempercepat view analytics
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_page_views_user_time 
ON page_views(user_id, viewed_at);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor 
ON page_views(visitor_id);

-- =====================================================
-- SOCIAL_CLICKS - Mempercepat social analytics
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_social_clicks_user_time 
ON social_clicks(user_id, clicked_at);

CREATE INDEX IF NOT EXISTS idx_social_clicks_visitor 
ON social_clicks(visitor_id);

-- =====================================================
-- LINKS & CONTACTS - Mempercepat profile loading
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_links_user 
ON links(user_id);

CREATE INDEX IF NOT EXISTS idx_contacts_user 
ON contacts(user_id);

-- =====================================================
-- COMMISSION_RATES - Mempercepat revenue calculation
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_commission_rates_platform_category 
ON commission_rates(platform, category);
