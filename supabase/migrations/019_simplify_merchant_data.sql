-- Migration: Simplify merchant_data table
-- Adds qr_payload and removes redundant columns

ALTER TABLE merchant_data ADD COLUMN IF NOT EXISTS qr_payload TEXT;

-- Move data if existing? Actually the user said to just remove them, 
-- but normally it's better to keep the identification name/city/bank.

ALTER TABLE merchant_data DROP COLUMN IF EXISTS merchant_id;
ALTER TABLE merchant_data DROP COLUMN IF EXISTS terminal_id;
ALTER TABLE merchant_data DROP COLUMN IF EXISTS mcc;
ALTER TABLE merchant_data DROP COLUMN IF EXISTS currency_code;
ALTER TABLE merchant_data DROP COLUMN IF EXISTS country_code;
