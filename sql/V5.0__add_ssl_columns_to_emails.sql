-- Add SSL-specific columns to emails table for Sosovalue platform
-- These columns track verification status and last action for SSL platform

-- Add ssl_isverified column
ALTER TABLE emails ADD COLUMN IF NOT EXISTS ssl_isverified BOOLEAN DEFAULT FALSE;

-- Add ssl_lastaction column  
ALTER TABLE emails ADD COLUMN IF NOT EXISTS ssl_lastaction INTEGER DEFAULT 0;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN emails.ssl_isverified IS 'Verification status for SSL/Sosovalue platform';
COMMENT ON COLUMN emails.ssl_lastaction IS 'Last action timestamp for SSL/Sosovalue platform (UNIX timestamp)'; 