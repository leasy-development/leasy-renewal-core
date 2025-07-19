-- Add language detection column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS language_detected text;

-- Add translation status columns for tracking what content exists
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_de text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_de text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS meta_description_de text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS meta_description_en text;

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_properties_language_detected ON properties(language_detected);