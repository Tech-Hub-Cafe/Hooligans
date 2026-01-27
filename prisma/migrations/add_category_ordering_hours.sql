-- Migration: Add category_ordering_hours table
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS category_ordering_hours (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  monday_ordering_hours VARCHAR(100),
  tuesday_ordering_hours VARCHAR(100),
  wednesday_ordering_hours VARCHAR(100),
  thursday_ordering_hours VARCHAR(100),
  friday_ordering_hours VARCHAR(100),
  saturday_ordering_hours VARCHAR(100),
  sunday_ordering_hours VARCHAR(100),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6)
);

-- Create unique constraint on category_name and item_type
CREATE UNIQUE INDEX IF NOT EXISTS category_ordering_hours_category_name_item_type_key 
  ON category_ordering_hours(category_name, item_type);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_ordering_hours_category_name ON category_ordering_hours(category_name);
CREATE INDEX IF NOT EXISTS idx_category_ordering_hours_item_type ON category_ordering_hours(item_type);

-- Add table comment
COMMENT ON TABLE category_ordering_hours IS 'Stores category-specific ordering hours that override general food/drinks hours';
