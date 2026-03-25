-- Migration: Add invoice_number to orders
-- Created: 2026-03-25

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
