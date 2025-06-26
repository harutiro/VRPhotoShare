-- Migration 003: Add taken_at column to photos table
-- Add taken_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' 
        AND column_name = 'taken_at'
    ) THEN
        ALTER TABLE photos ADD COLUMN taken_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for efficient sorting by taken_at
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('003_add_taken_at') 
ON CONFLICT (version) DO NOTHING; 