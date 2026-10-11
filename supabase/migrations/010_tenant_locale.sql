-- Migration: Add locale to tenants for AI-generated SK/CZ notification content
-- Rollback: ALTER TABLE tenants DROP COLUMN locale;

ALTER TABLE tenants
ADD COLUMN locale TEXT NOT NULL DEFAULT 'sk' CHECK (locale IN ('sk', 'cz'));
