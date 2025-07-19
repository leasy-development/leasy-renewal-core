-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embeddings column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS embedding_vector VECTOR(384);

-- Create table for media hashes
CREATE TABLE IF NOT EXISTS property_media_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  hash_type TEXT NOT NULL DEFAULT 'blockhash',
  hash_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_url, hash_type)
);

-- Enable RLS on media hashes table
ALTER TABLE property_media_hashes ENABLE ROW LEVEL SECURITY;

-- Create policies for media hashes
CREATE POLICY "Users can view media hashes for their properties" 
ON property_media_hashes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_media_hashes.property_id 
  AND properties.user_id = auth.uid()
));

CREATE POLICY "Users can manage media hashes for their properties" 
ON property_media_hashes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_media_hashes.property_id 
  AND properties.user_id = auth.uid()
));

-- Create false positives exclusion table
CREATE TABLE IF NOT EXISTS duplicate_false_positives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id_1 UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_id_2 UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id_1, property_id_2)
);

-- Enable RLS on false positives table
ALTER TABLE duplicate_false_positives ENABLE ROW LEVEL SECURITY;

-- Create policy for false positives (admin only)
CREATE POLICY "Admins can manage false positives" 
ON duplicate_false_positives 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_embedding ON properties USING ivfflat (embedding_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_media_hashes_property_id ON property_media_hashes(property_id);
CREATE INDEX IF NOT EXISTS idx_media_hashes_hash_value ON property_media_hashes(hash_value);
CREATE INDEX IF NOT EXISTS idx_false_positives_properties ON duplicate_false_positives(property_id_1, property_id_2);