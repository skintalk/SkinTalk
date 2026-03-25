-- Add product detail columns for high-converting layout
ALTER TABLE products ADD COLUMN benefits TEXT;
ALTER TABLE products ADD COLUMN how_to_use TEXT;
ALTER TABLE products ADD COLUMN ingredients TEXT;
ALTER TABLE products ADD COLUMN short_benefit TEXT;
