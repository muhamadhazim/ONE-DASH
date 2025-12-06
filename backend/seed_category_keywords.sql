-- Create category_keywords table
CREATE TABLE IF NOT EXISTS category_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'title', -- 'title' or 'breadcrumb'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, keyword, source)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_keywords_keyword ON category_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_category_keywords_source ON category_keywords(source);

-- Seed Electronics keywords (title-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Electronics', 'iphone', 'title'),
('Electronics', 'samsung', 'title'),
('Electronics', 'xiaomi', 'title'),
('Electronics', 'phone', 'title'),
('Electronics', 'laptop', 'title'),
('Electronics', 'headphone', 'title'),
('Electronics', 'earphone', 'title'),
('Electronics', 'airpods', 'title'),
('Electronics', 'macbook', 'title'),
('Electronics', 'tablet', 'title'),
('Electronics', 'speaker', 'title'),
('Electronics', 'audio', 'title'),
('Electronics', 'bluetooth', 'title'),
('Electronics', 'wireless', 'title'),
('Electronics', 'elektronik', 'title'),
('Electronics', 'kamera', 'title'),
('Electronics', 'camera', 'title'),
('Electronics', 'tv', 'title'),
('Electronics', 'monitor', 'title'),
('Electronics', 'keyboard', 'title'),
('Electronics', 'mouse', 'title')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Electronics keywords (breadcrumb-based - from Tokopedia BreadcrumbList)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Electronics', 'elektronik', 'breadcrumb'),
('Electronics', 'audio', 'breadcrumb'),
('Electronics', 'speaker', 'breadcrumb'),
('Electronics', 'kamera', 'breadcrumb'),
('Electronics', 'handphone', 'breadcrumb'),
('Electronics', 'laptop', 'breadcrumb'),
('Electronics', 'komputer', 'breadcrumb'),
('Electronics', 'tv', 'breadcrumb'),
('Electronics', 'gaming', 'breadcrumb')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Fashion keywords (title-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Fashion', 'baju', 'title'),
('Fashion', 'kaos', 'title'),
('Fashion', 'celana', 'title'),
('Fashion', 'dress', 'title'),
('Fashion', 'sepatu', 'title'),
('Fashion', 'shoes', 'title'),
('Fashion', 'jacket', 'title'),
('Fashion', 'jaket', 'title'),
('Fashion', 'hoodie', 'title'),
('Fashion', 'fashion', 'title')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Fashion keywords (breadcrumb-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Fashion', 'fashion', 'breadcrumb'),
('Fashion', 'pakaian', 'breadcrumb'),
('Fashion', 'sepatu', 'breadcrumb'),
('Fashion', 'tas', 'breadcrumb'),
('Fashion', 'aksesoris', 'breadcrumb')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Beauty keywords (title-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Beauty', 'skincare', 'title'),
('Beauty', 'serum', 'title'),
('Beauty', 'makeup', 'title'),
('Beauty', 'lipstick', 'title'),
('Beauty', 'parfum', 'title'),
('Beauty', 'beauty', 'title')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Beauty keywords (breadcrumb-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Beauty', 'kecantikan', 'breadcrumb'),
('Beauty', 'perawatan', 'breadcrumb'),
('Beauty', 'makeup', 'breadcrumb'),
('Beauty', 'skincare', 'breadcrumb')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Food keywords (title-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Food', 'makanan', 'title'),
('Food', 'snack', 'title'),
('Food', 'kopi', 'title'),
('Food', 'food', 'title')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Food keywords (breadcrumb-based)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Food', 'makanan', 'breadcrumb'),
('Food', 'minuman', 'breadcrumb'),
('Food', 'food', 'breadcrumb')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Seed Home keywords (breadcrumb-based only)
INSERT INTO category_keywords (category, keyword, source) VALUES
('Home', 'rumah tangga', 'breadcrumb'),
('Home', 'furniture', 'breadcrumb'),
('Home', 'dekorasi', 'breadcrumb')
ON CONFLICT (category, keyword, source) DO NOTHING;

-- Verify insertion
SELECT category, COUNT(*) as keyword_count FROM category_keywords GROUP BY category ORDER BY category;
