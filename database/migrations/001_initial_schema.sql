-- Migration: 001_initial_schema
-- Description: Create initial threat intelligence database schema with PostGIS support
-- Date: 2024-12-18

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for threat types
CREATE TYPE threat_type_enum AS ENUM (
    'vulnerability',
    'scam', 
    'financial_risk',
    'protection'
);

-- Main threat intelligence table
CREATE TABLE IF NOT EXISTS threat_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subhead VARCHAR(500),
    description TEXT NOT NULL,
    coordinates POINT NOT NULL, -- PostGIS point type
    threat_type threat_type_enum NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    region VARCHAR(100),
    brands TEXT[], -- Array of brand names
    topics TEXT[], -- Array of topic tags
    is_quantitative BOOLEAN DEFAULT FALSE,
    statistical_data JSONB,
    sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiration_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Geographic indexing for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_threat_data_coordinates ON threat_data USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_threat_data_region ON threat_data (region);
CREATE INDEX IF NOT EXISTS idx_threat_data_type ON threat_data (threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_data_active ON threat_data (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_threat_data_severity ON threat_data (severity);
CREATE INDEX IF NOT EXISTS idx_threat_data_created_at ON threat_data (created_at);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_threat_data_search ON threat_data USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(subhead, '') || ' ' || description)
);

-- Brands array index for filtering
CREATE INDEX IF NOT EXISTS idx_threat_data_brands ON threat_data USING GIN (brands);

-- Topics array index for filtering  
CREATE INDEX IF NOT EXISTS idx_threat_data_topics ON threat_data USING GIN (topics);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_threat_data_updated_at 
    BEFORE UPDATE ON threat_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old threats
CREATE OR REPLACE FUNCTION expire_old_threats()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE threat_data 
    SET is_active = FALSE 
    WHERE expiration_date IS NOT NULL 
    AND expiration_date < NOW() 
    AND is_active = TRUE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Create a view for active threats only
CREATE OR REPLACE VIEW active_threats AS
SELECT * FROM threat_data WHERE is_active = TRUE;

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING;