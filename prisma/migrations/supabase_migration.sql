-- Hooligans Database Migration for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if needed (for future use)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255),
    "name" VARCHAR(255),
    "phone" VARCHAR(50),
    "image" TEXT,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'credentials',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_admin" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- ============================================
-- 2. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "menu_items" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "image_url" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "menu_items_category_idx" ON "menu_items"("category");
CREATE INDEX IF NOT EXISTS "menu_items_available_idx" ON "menu_items"("available");

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL PRIMARY KEY,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "customer_phone" VARCHAR(50),
    "items" JSONB NOT NULL,
    "total" DECIMAL(10, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "special_instructions" TEXT,
    "user_id" INTEGER,
    "square_payment_id" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");

-- ============================================
-- 4. CAFE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "cafe_settings" (
    "id" SERIAL PRIMARY KEY,
    "cafe_name" VARCHAR(255) DEFAULT 'Hooligans',
    "tagline" VARCHAR(500),
    "description" TEXT,
    "address" VARCHAR(500),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "monday_hours" VARCHAR(100) DEFAULT '7am - 8pm',
    "tuesday_hours" VARCHAR(100) DEFAULT '7am - 8pm',
    "wednesday_hours" VARCHAR(100) DEFAULT '7am - 8pm',
    "thursday_hours" VARCHAR(100) DEFAULT '7am - 8pm',
    "friday_hours" VARCHAR(100) DEFAULT '7am - 8pm',
    "saturday_hours" VARCHAR(100) DEFAULT '8am - 9pm',
    "sunday_hours" VARCHAR(100) DEFAULT '8am - 9pm',
    "monday_food_ordering_hours" VARCHAR(100),
    "tuesday_food_ordering_hours" VARCHAR(100),
    "wednesday_food_ordering_hours" VARCHAR(100),
    "thursday_food_ordering_hours" VARCHAR(100),
    "friday_food_ordering_hours" VARCHAR(100),
    "saturday_food_ordering_hours" VARCHAR(100),
    "sunday_food_ordering_hours" VARCHAR(100),
    "monday_drinks_ordering_hours" VARCHAR(100),
    "tuesday_drinks_ordering_hours" VARCHAR(100),
    "wednesday_drinks_ordering_hours" VARCHAR(100),
    "thursday_drinks_ordering_hours" VARCHAR(100),
    "friday_drinks_ordering_hours" VARCHAR(100),
    "saturday_drinks_ordering_hours" VARCHAR(100),
    "sunday_drinks_ordering_hours" VARCHAR(100),
    "facebook_url" VARCHAR(500),
    "instagram_url" VARCHAR(500),
    "twitter_url" VARCHAR(500),
    "tiktok_url" VARCHAR(500),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Australia/Sydney',
    "updated_at" TIMESTAMP
);

-- ============================================
-- 5. DISABLED MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "disabled_menu_items" (
    "id" SERIAL PRIMARY KEY,
    "square_id" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "disabled_menu_items_square_id_idx" ON "disabled_menu_items"("square_id");

-- ============================================
-- 6. DISABLED CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "disabled_categories" (
    "id" SERIAL PRIMARY KEY,
    "category_name" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "disabled_categories_category_name_idx" ON "disabled_categories"("category_name");

-- ============================================
-- 7. PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL PRIMARY KEY,
    "token" VARCHAR(255) NOT NULL UNIQUE,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- ============================================
-- 8. TRIGGER FOR UPDATED_AT IN ORDERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. TRIGGER FOR UPDATED_AT IN CAFE_SETTINGS
-- ============================================
CREATE TRIGGER update_cafe_settings_updated_at BEFORE UPDATE ON "cafe_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. INSERT DEFAULT CAFE SETTINGS (if none exist)
-- ============================================
INSERT INTO "cafe_settings" ("cafe_name", "tagline", "description")
SELECT 
    'Hooligans',
    'Artisan Coffee & Cuisine',
    'Crafting exceptional coffee and culinary experiences since 2024.'
WHERE NOT EXISTS (SELECT 1 FROM "cafe_settings");

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables, indexes, and constraints have been created.
-- You can now use Prisma to manage your database schema.
