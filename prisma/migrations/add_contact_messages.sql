-- Contact Messages table (for contact form submissions)
-- Run this in your Supabase SQL Editor if contact_messages does not exist

CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "contact_messages_email_idx" ON "contact_messages"("email");
CREATE INDEX IF NOT EXISTS "contact_messages_read_idx" ON "contact_messages"("read");
CREATE INDEX IF NOT EXISTS "contact_messages_created_at_idx" ON "contact_messages"("created_at");
