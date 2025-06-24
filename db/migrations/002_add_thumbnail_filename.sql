-- Migration 002: Add thumbnail_filename column to photos table
-- Add thumbnail_filename column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' 
        AND column_name = 'thumbnail_filename'
    ) THEN
        ALTER TABLE photos ADD COLUMN thumbnail_filename TEXT;
    END IF;
END $$;

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('002_add_thumbnail_filename') 
ON CONFLICT (version) DO NOTHING; 