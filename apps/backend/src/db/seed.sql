-- Dev seed data: mock vendors + services covering every category in
-- apps/mobile/src/lib/interests.ts, with placeholder logo images
-- (https://picsum.photos, seeded by slug for stable images per vendor).
-- Idempotent: vendors use ON CONFLICT (slug) DO NOTHING, services use a
-- NOT EXISTS guard keyed on (vendor_id, name).
--
-- Usage: psql -d scalio -f apps/backend/src/db/seed.sql

-- Backfill images/visit cadence on the existing demo vendors
UPDATE vendors SET logo_url = 'https://picsum.photos/seed/glow-salon/600/400', average_days_between_visits = 21
WHERE slug = 'glow-salon' AND logo_url IS NULL;

UPDATE vendors SET logo_url = 'https://picsum.photos/seed/serenity-spa/600/400', average_days_between_visits = 30
WHERE slug = 'serenity-spa' AND logo_url IS NULL;

-- New vendors across the remaining interest categories
INSERT INTO vendors (slug, business_name, category, logo_url, theme_color, average_days_between_visits, featured)
VALUES
  ('polished-nails', 'Polished Nail Bar', 'Nails', 'https://picsum.photos/seed/polished-nails/600/400', '#FF6F91', 21, true),
  ('lash-loft', 'The Lash Loft', 'Lashes', 'https://picsum.photos/seed/lash-loft/600/400', '#9C27B0', 18, false),
  ('sharp-cuts', 'Sharp Cuts Barbershop', 'Barbing', 'https://picsum.photos/seed/sharp-cuts/600/400', '#2196F3', 14, true),
  ('zen-massage', 'Zen Massage Studio', 'Massage', 'https://picsum.photos/seed/zen-massage/600/400', '#00BCD4', 30, false),
  ('glam-studio', 'Glam Makeup Studio', 'Makeup', 'https://picsum.photos/seed/glam-studio/600/400', '#FF9800', 45, true),
  ('brow-bar', 'The Brow Bar', 'Brows', 'https://picsum.photos/seed/brow-bar/600/400', '#795548', 28, false)
ON CONFLICT (slug) DO NOTHING;

-- A third service for the existing Glow Hair Salon
INSERT INTO services (vendor_id, name, duration_minutes, price_kobo, payment_mode, deposit_percent)
SELECT v.id, 'Blowout', 45, 800000, 'pay_on_arrival', NULL
FROM vendors v
WHERE v.slug = 'glow-salon'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.vendor_id = v.id AND s.name = 'Blowout');

-- Two more services for the existing Serenity Spa
INSERT INTO services (vendor_id, name, duration_minutes, price_kobo, payment_mode, deposit_percent)
SELECT v.id, x.name, x.duration_minutes, x.price_kobo, x.payment_mode, x.deposit_percent
FROM vendors v
CROSS JOIN (VALUES
  ('Hot Stone Therapy', 90, 3000000, 'deposit', 30),
  ('Facial Treatment', 45, 1500000, 'pay_on_arrival', NULL)
) AS x(name, duration_minutes, price_kobo, payment_mode, deposit_percent)
WHERE v.slug = 'serenity-spa'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.vendor_id = v.id AND s.name = x.name);

-- Services for the new vendors
INSERT INTO services (vendor_id, name, duration_minutes, price_kobo, payment_mode, deposit_percent)
SELECT v.id, x.name, x.duration_minutes, x.price_kobo, x.payment_mode, x.deposit_percent
FROM vendors v
CROSS JOIN (VALUES
  ('polished-nails', 'Classic Manicure', 45, 600000, 'pay_on_arrival', NULL),
  ('polished-nails', 'Gel Pedicure', 60, 1000000, 'pay_on_arrival', NULL),
  ('polished-nails', 'Acrylic Full Set', 90, 1800000, 'deposit', 30),

  ('lash-loft', 'Classic Lash Extensions', 90, 1500000, 'deposit', 50),
  ('lash-loft', 'Lash Lift & Tint', 60, 1200000, 'pay_on_arrival', NULL),
  ('lash-loft', 'Lash Refill', 45, 800000, 'pay_on_arrival', NULL),

  ('sharp-cuts', 'Signature Haircut', 30, 500000, 'pay_on_arrival', NULL),
  ('sharp-cuts', 'Beard Trim & Shape', 20, 300000, 'pay_on_arrival', NULL),
  ('sharp-cuts', 'Full Grooming Package', 60, 1000000, 'deposit', 50),

  ('zen-massage', 'Deep Tissue Massage', 60, 2200000, 'pay_on_arrival', NULL),
  ('zen-massage', 'Aromatherapy Massage', 75, 2600000, 'pay_on_arrival', NULL),
  ('zen-massage', 'Couples Massage', 90, 4500000, 'full_prepayment', NULL),

  ('glam-studio', 'Everyday Glam', 60, 1500000, 'pay_on_arrival', NULL),
  ('glam-studio', 'Bridal Makeup Trial', 90, 2500000, 'deposit', 50),
  ('glam-studio', 'Full Bridal Package', 180, 8000000, 'full_prepayment', NULL),

  ('brow-bar', 'Brow Shaping', 20, 400000, 'pay_on_arrival', NULL),
  ('brow-bar', 'Henna Brow Tint', 30, 700000, 'pay_on_arrival', NULL),
  ('brow-bar', 'Microblading', 120, 4000000, 'full_prepayment', NULL)
) AS x(slug, name, duration_minutes, price_kobo, payment_mode, deposit_percent)
WHERE v.slug = x.slug
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.vendor_id = v.id AND s.name = x.name);

-- Laundromat vendor
INSERT INTO vendors (slug, business_name, category, logo_url, theme_color, average_days_between_visits, featured)
VALUES ('true-wash', 'True Wash Laundromat', 'Laundromat', 'http://localhost:3000/true-wash.jpeg', '#00ACC1', 14, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (vendor_id, name, duration_minutes, price_kobo, payment_mode, deposit_percent)
SELECT v.id, x.name, x.duration_minutes, x.price_kobo, x.payment_mode, x.deposit_percent
FROM vendors v
CROSS JOIN (VALUES
  ('Clothing Laundry', 120, 250000, 'pay_on_arrival', NULL::integer),
  ('Duvet Laundry', 240, 400000, 'pay_on_arrival', NULL::integer)
) AS x(name, duration_minutes, price_kobo, payment_mode, deposit_percent)
WHERE v.slug = 'true-wash'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.vendor_id = v.id AND s.name = x.name);

UPDATE vendors SET
  address      = '12 Admiralty Way, Lekki Phase 1, Lagos',
  rating       = 4.7,
  review_count = 156
WHERE slug = 'true-wash';

-- Refresh vendor cover images to category-appropriate LoremFlickr photos (re-runnable)
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/hair,salon,interior?lock=55' WHERE slug = 'glow-salon';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/spa,wellness?lock=2' WHERE slug = 'serenity-spa';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/nail,salon?lock=3' WHERE slug = 'polished-nails';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/lash,studio,beauty?lock=58' WHERE slug = 'lash-loft';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/barber,hair?lock=5' WHERE slug = 'sharp-cuts';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/spa,candle,luxury?lock=17' WHERE slug = 'zen-massage';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/makeup,cosmetics?lock=7' WHERE slug = 'glam-studio';
UPDATE vendors SET logo_url = 'https://loremflickr.com/600/400/beauty,makeup,studio?lock=43' WHERE slug = 'brow-bar';

-- Backfill addresses, ratings, and review counts (re-runnable)
UPDATE vendors SET
  address      = '14 Admiralty Way, Lekki Phase 1, Lagos',
  rating       = 4.8,
  review_count = 312
WHERE slug = 'glow-salon';

UPDATE vendors SET
  address      = '7 Adeola Odeku Street, Victoria Island, Lagos',
  rating       = 4.9,
  review_count = 187
WHERE slug = 'serenity-spa';

UPDATE vendors SET
  address      = '3 Isaac John Street, Ikeja GRA, Lagos',
  rating       = 4.7,
  review_count = 204
WHERE slug = 'polished-nails';

UPDATE vendors SET
  address      = '22 Ozumba Mbadiwe Avenue, Victoria Island, Lagos',
  rating       = 4.9,
  review_count = 95
WHERE slug = 'lash-loft';

UPDATE vendors SET
  address      = '5 Bode Thomas Street, Surulere, Lagos',
  rating       = 4.6,
  review_count = 431
WHERE slug = 'sharp-cuts';

UPDATE vendors SET
  address      = '18 Ligali Ayorinde Street, Victoria Island, Lagos',
  rating       = 4.8,
  review_count = 143
WHERE slug = 'zen-massage';

UPDATE vendors SET
  address      = '10 Akin Adesola Street, Victoria Island, Lagos',
  rating       = 4.7,
  review_count = 268
WHERE slug = 'glam-studio';

UPDATE vendors SET
  address      = '31 Fola Osibo Road, Lekki Phase 1, Lagos',
  rating       = 4.5,
  review_count = 119
WHERE slug = 'brow-bar';
