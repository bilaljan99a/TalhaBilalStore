-- Adds an optional YouTube embed URL to CMS products.
-- Safe to re-run: existing products keep video_url = NULL.
ALTER TABLE public.cms_products
  ADD COLUMN IF NOT EXISTS video_url text;
