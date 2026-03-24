-- Migration: Add selected column to merchant_data
-- Created: 2026-03-25

ALTER TABLE merchant_data ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false;

-- Only one merchant can be selected at a time
CREATE OR REPLACE FUNCTION set_selected_merchant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.selected = true THEN
        UPDATE merchant_data SET selected = false WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_selected ON merchant_data;
CREATE TRIGGER ensure_single_selected
    AFTER INSERT OR UPDATE ON merchant_data
    FOR EACH ROW
    EXECUTE FUNCTION set_selected_merchant();
