-- Migration: Add combo hours and category assignments
-- Run this SQL in your Supabase SQL editor

-- Add combo ordering hours columns to cafe_settings
ALTER TABLE cafe_settings
  ADD COLUMN IF NOT EXISTS monday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tuesday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS wednesday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS thursday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS friday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS saturday_combo_ordering_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sunday_combo_ordering_hours VARCHAR(100);

-- Create category_ordering_assignments table
CREATE TABLE IF NOT EXISTS category_ordering_assignments (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL UNIQUE,
  section VARCHAR(50) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_ordering_assignments_category_name 
  ON category_ordering_assignments(category_name);
CREATE INDEX IF NOT EXISTS idx_category_ordering_assignments_section 
  ON category_ordering_assignments(section);

-- Add table comment
COMMENT ON TABLE category_ordering_assignments IS 'Maps Square categories to ordering hours sections (food/drinks/combo)';

-- Drop old category_ordering_hours table if it exists
DROP TABLE IF EXISTS category_ordering_hours;
