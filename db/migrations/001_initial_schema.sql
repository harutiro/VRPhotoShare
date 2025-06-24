-- Migration 001: Initial schema
-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    custom_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    album_id INT REFERENCES albums(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    image_data TEXT,
    thumbnail_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create migrations tracking table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration as applied
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema') 
ON CONFLICT (version) DO NOTHING; 