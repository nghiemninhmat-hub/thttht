-- Add secondary price/currency columns to support dual-currency items (e.g. "1.500 Công Đức / 30 Âm Đức")
ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS price_secondary int,
  ADD COLUMN IF NOT EXISTS currency_type_secondary text CHECK (currency_type_secondary IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC')),
  ADD COLUMN IF NOT EXISTS shop_area text DEFAULT 'Thường' CHECK (shop_area IN ('Thường', 'Hiếm', 'Sự kiện')),
  ADD COLUMN IF NOT EXISTS purchase_limit text;