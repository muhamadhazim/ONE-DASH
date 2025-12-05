-- Seed Data untuk Commission Rates
-- Jalankan ini di Supabase SQL Editor atau psql setelah tabel ter-create

-- Hapus data lama jika ada
DELETE FROM commission_rates;

-- =====================
-- SHOPEE
-- =====================
INSERT INTO commission_rates (platform, category, rate_percent, max_commission, notes) VALUES
('shopee', 'Fashion', 2.00, 10000, 'Non-elektronik via media sosial'),
('shopee', 'Beauty', 2.00, 10000, 'Non-elektronik via media sosial'),
('shopee', 'Home', 2.00, 10000, 'Non-elektronik via media sosial'),
('shopee', 'Food', 2.00, 10000, 'Non-elektronik via media sosial'),
('shopee', 'Electronics', 0.50, 10000, 'Elektronik via media sosial'),
('shopee', 'Other', 2.00, 10000, 'Default non-elektronik');

-- =====================
-- TOKOPEDIA
-- =====================
INSERT INTO commission_rates (platform, category, rate_percent, max_commission, notes) VALUES
('tokopedia', 'Fashion', 10.00, 50000, 'Fashion & Kecantikan'),
('tokopedia', 'Beauty', 10.00, 50000, 'Fashion & Kecantikan'),
('tokopedia', 'Food', 7.00, 50000, 'Makanan & Minuman'),
('tokopedia', 'Health', 5.00, NULL, 'Kesehatan'),
('tokopedia', 'Baby', 5.00, NULL, 'Ibu & Bayi'),
('tokopedia', 'Gadget', 5.00, NULL, 'Aksesoris HP, Gadget'),
('tokopedia', 'Home', 4.00, NULL, 'Rumah tangga'),
('tokopedia', 'Books', 4.00, NULL, 'Buku'),
('tokopedia', 'Audio', 2.00, NULL, 'Audio'),
('tokopedia', 'Automotive', 2.00, NULL, 'Otomotif ringan'),
('tokopedia', 'Sports', 2.00, NULL, 'Olahraga'),
('tokopedia', 'Hobby', 2.00, NULL, 'Hobi & Mainan'),
('tokopedia', 'Electronics', 1.00, NULL, 'Elektronik, Handphone, Tablet'),
('tokopedia', 'Other', 2.00, NULL, 'Default');

-- =====================
-- LAZADA
-- =====================
INSERT INTO commission_rates (platform, category, rate_percent, max_commission, notes) VALUES
('lazada', 'Fashion', 10.00, NULL, 'Fashion (bisa 5-35% saat promo)'),
('lazada', 'Beauty', 10.00, NULL, 'Beauty (bisa 5-35% saat promo)'),
('lazada', 'Home', 5.00, NULL, 'Home & Living'),
('lazada', 'Electronics', 2.00, NULL, 'Elektronik, Otomotif, Produk Digital'),
('lazada', 'Automotive', 2.00, NULL, 'Otomotif berat'),
('lazada', 'Other', 1.20, NULL, 'Default minimum');

-- =====================
-- BLIBLI
-- =====================
INSERT INTO commission_rates (platform, category, rate_percent, max_commission, notes) VALUES
('blibli', 'Fashion', 4.00, NULL, 'Rate umum hingga 4%'),
('blibli', 'Beauty', 4.00, NULL, 'Rate umum hingga 4%'),
('blibli', 'Electronics', 4.00, NULL, 'Rate umum hingga 4%'),
('blibli', 'Home', 4.00, NULL, 'Rate umum hingga 4%'),
('blibli', 'Other', 4.00, NULL, 'Rate umum hingga 4%');

-- Verify
SELECT platform, category, rate_percent, max_commission FROM commission_rates ORDER BY platform, category;
