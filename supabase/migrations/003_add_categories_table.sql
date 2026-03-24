-- Migration: Add categories table
-- Created: 2026-03-24

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);

-- Insert default categories
INSERT INTO categories (name) VALUES 
    ('General'),
    ('Serums'),
    ('Moisturizers'),
    ('Cleansers')
ON CONFLICT (name) DO NOTHING;
