-- SQL migration to add comments field to activities table and update tools table for tag change tracking

-- Add comments column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add previous_status column to activities table to track "from X to Y" changes
ALTER TABLE activities ADD COLUMN IF NOT EXISTS previous_status TEXT;

-- Update existing activities to have empty comments
UPDATE activities SET comments = '' WHERE comments IS NULL;

-- Example of updated activities table structure:
-- activities table now has:
-- id, user_id, action, tool_id, timestamp, details, comments, previous_status
