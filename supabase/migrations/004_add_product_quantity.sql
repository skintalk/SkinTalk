-- Migration: Add quantity to products table
-- Created: 2026-03-24

ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Update existing products to have some quantity
UPDATE products SET quantity = 10 WHERE quantity IS NULL OR quantity = 0;
