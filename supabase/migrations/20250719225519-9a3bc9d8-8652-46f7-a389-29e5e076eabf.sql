-- Enhanced Duplicate Detection System Migration

-- Create settings table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.duplicate_detection_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.duplicate_detection_settings (setting_key, setting_value, description) VALUES
  ('similarity_threshold', '{"value": 0.85}', 'Minimum confidence score for duplicate detection (0.0 - 1.0)'),
  ('title_weight', '{"value": 0.30}', 'Weight for title similarity in scoring'),
  ('address_weight', '{"value": 0.35}', 'Weight for address similarity in scoring'),
  ('specs_weight', '{"value": 0.20}', 'Weight for property specifications in scoring'),
  ('description_weight', '{"value": 0.10}', 'Weight for description similarity in scoring'),
  ('images_weight', '{"value": 0.05}', 'Weight for image similarity in scoring'),
  ('use_enhanced_algorithms', '{"value": true}', 'Enable Jaro-Winkler and advanced text similarity'),
  ('enable_image_hashing', '{"value": true}', 'Enable perceptual image hashing for comparison'),
  ('include_intra_user', '{"value": false}', 'Detect duplicates within same user properties'),
  ('auto_scan_new_properties', '{"value": true}', 'Automatically scan new properties for duplicates')
ON CONFLICT (setting_key) DO NOTHING;

-- Add RLS for settings (admin only)
ALTER TABLE public.duplicate_detection_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage detection settings" 
ON public.duplicate_detection_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read detection settings" 
ON public.duplicate_detection_settings 
FOR SELECT 
USING (true);

-- Create function to update settings timestamp
CREATE OR REPLACE FUNCTION public.update_duplicate_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_duplicate_settings_updated_at
  BEFORE UPDATE ON public.duplicate_detection_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_duplicate_settings_timestamp();

-- Enhanced property_media_hashes table for image comparison
CREATE TABLE IF NOT EXISTS public.property_media_hashes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  hash_value TEXT NOT NULL,
  hash_type TEXT NOT NULL DEFAULT 'blockhash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, media_url, hash_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_media_hashes_property_id ON public.property_media_hashes(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_hashes_hash_value ON public.property_media_hashes(hash_value);
CREATE INDEX IF NOT EXISTS idx_property_media_hashes_hash_type ON public.property_media_hashes(hash_type);

-- RLS for media hashes
ALTER TABLE public.property_media_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage media hashes for their properties" 
ON public.property_media_hashes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_media_hashes.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view media hashes for their properties" 
ON public.property_media_hashes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_media_hashes.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Create false positives tracking table
CREATE TABLE IF NOT EXISTS public.duplicate_false_positives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id_1 UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_id_2 UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id_1, property_id_2)
);

-- Add index for false positives
CREATE INDEX IF NOT EXISTS idx_duplicate_false_positives_properties ON public.duplicate_false_positives(property_id_1, property_id_2);

-- RLS for false positives (admin only)
ALTER TABLE public.duplicate_false_positives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage false positives" 
ON public.duplicate_false_positives 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create merged properties tracking table
CREATE TABLE IF NOT EXISTS public.merged_properties_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_property_id UUID NOT NULL,
  target_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merged_by UUID NOT NULL REFERENCES auth.users(id),
  merge_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  merge_reason TEXT,
  original_data JSONB NOT NULL,
  fingerprint TEXT NOT NULL
);

-- Add indexes for merged properties tracking
CREATE INDEX IF NOT EXISTS idx_merged_properties_fingerprint ON public.merged_properties_tracking(fingerprint);
CREATE INDEX IF NOT EXISTS idx_merged_properties_target ON public.merged_properties_tracking(target_property_id);
CREATE INDEX IF NOT EXISTS idx_merged_properties_original ON public.merged_properties_tracking(original_property_id);

-- RLS for merged properties tracking (admin only)
ALTER TABLE public.merged_properties_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view merged properties tracking" 
ON public.merged_properties_tracking 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enhance duplicate_detection_log with more details
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'duplicate_group_id') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN duplicate_group_id UUID REFERENCES public.global_duplicate_groups(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'admin_user_id') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN admin_user_id UUID NOT NULL REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'action_type') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN action_type TEXT NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'affected_properties') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN affected_properties UUID[] NOT NULL DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'details') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN details JSONB NOT NULL DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'duplicate_detection_log' AND column_name = 'created_at') THEN
    ALTER TABLE public.duplicate_detection_log ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- RLS for detection logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'duplicate_detection_log' 
    AND policyname = 'Admins can view detection logs'
  ) THEN
    CREATE POLICY "Admins can view detection logs" 
    ON public.duplicate_detection_log 
    FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create function to get duplicate detection statistics
CREATE OR REPLACE FUNCTION public.get_duplicate_detection_stats(admin_user_id UUID)
RETURNS TABLE(
  total_groups INTEGER,
  pending_groups INTEGER,
  resolved_groups INTEGER,
  dismissed_groups INTEGER,
  high_confidence_groups INTEGER,
  recent_scans INTEGER,
  last_scan_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.global_duplicate_groups) as total_groups,
    (SELECT COUNT(*)::INTEGER FROM public.global_duplicate_groups WHERE status = 'pending') as pending_groups,
    (SELECT COUNT(*)::INTEGER FROM public.global_duplicate_groups WHERE status = 'resolved') as resolved_groups,
    (SELECT COUNT(*)::INTEGER FROM public.global_duplicate_groups WHERE status = 'dismissed') as dismissed_groups,
    (SELECT COUNT(*)::INTEGER FROM public.global_duplicate_groups WHERE confidence_score >= 0.9) as high_confidence_groups,
    (SELECT COUNT(*)::INTEGER FROM public.duplicate_detection_log WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_scans,
    (SELECT MAX(created_at) FROM public.duplicate_detection_log WHERE action_type LIKE '%scan%') as last_scan_date;
END;
$$;

-- Create function to check for potential duplicates before property creation
CREATE OR REPLACE FUNCTION public.check_potential_duplicate(
  p_title TEXT,
  p_street_name TEXT,
  p_street_number TEXT,
  p_city TEXT,
  p_zip_code TEXT,
  p_monthly_rent NUMERIC,
  p_bedrooms INTEGER,
  p_square_meters NUMERIC,
  similarity_threshold NUMERIC DEFAULT 0.85
)
RETURNS TABLE(
  property_id UUID,
  similarity_score NUMERIC,
  match_reasons TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fingerprint TEXT;
  existing_prop RECORD;
  addr_similarity NUMERIC;
  title_similarity NUMERIC;
  specs_similarity NUMERIC;
  overall_score NUMERIC;
  reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Generate fingerprint for the new property
  fingerprint := public.generate_property_fingerprint(
    p_title, p_street_name, p_street_number, p_zip_code, p_city, 
    p_monthly_rent, p_bedrooms, p_square_meters
  );
  
  -- Check for exact fingerprint match (merged duplicate)
  IF EXISTS (SELECT 1 FROM public.merged_properties_tracking WHERE fingerprint = fingerprint) THEN
    RETURN QUERY
    SELECT 
      mpt.target_property_id,
      1.0::NUMERIC as similarity_score,
      ARRAY['exact_duplicate_previously_merged']::TEXT[] as match_reasons
    FROM public.merged_properties_tracking mpt
    WHERE mpt.fingerprint = fingerprint
    LIMIT 1;
    RETURN;
  END IF;
  
  -- Check against existing properties
  FOR existing_prop IN 
    SELECT id, title, street_name, street_number, city, zip_code, 
           monthly_rent, bedrooms, square_meters
    FROM public.properties
    WHERE status != 'inactive'
  LOOP
    reasons := ARRAY[]::TEXT[];
    overall_score := 0;
    
    -- Simple title similarity (can be enhanced with fuzzy matching)
    title_similarity := CASE 
      WHEN LOWER(TRIM(p_title)) = LOWER(TRIM(existing_prop.title)) THEN 1.0
      WHEN LOWER(TRIM(p_title)) ILIKE '%' || LOWER(TRIM(existing_prop.title)) || '%' OR 
           LOWER(TRIM(existing_prop.title)) ILIKE '%' || LOWER(TRIM(p_title)) || '%' THEN 0.8
      ELSE 0.0
    END;
    
    -- Address similarity
    addr_similarity := CASE
      WHEN LOWER(TRIM(p_street_name)) = LOWER(TRIM(existing_prop.street_name)) AND
           LOWER(TRIM(p_city)) = LOWER(TRIM(existing_prop.city)) THEN
        CASE 
          WHEN p_street_number = existing_prop.street_number THEN 1.0
          ELSE 0.9
        END
      WHEN LOWER(TRIM(p_city)) = LOWER(TRIM(existing_prop.city)) AND
           p_zip_code = existing_prop.zip_code THEN 0.7
      ELSE 0.0
    END;
    
    -- Specs similarity
    specs_similarity := 0;
    IF p_bedrooms = existing_prop.bedrooms THEN
      specs_similarity := specs_similarity + 0.3;
    END IF;
    
    IF p_monthly_rent IS NOT NULL AND existing_prop.monthly_rent IS NOT NULL THEN
      IF ABS(p_monthly_rent - existing_prop.monthly_rent) <= (GREATEST(p_monthly_rent, existing_prop.monthly_rent) * 0.1) THEN
        specs_similarity := specs_similarity + 0.4;
      END IF;
    END IF;
    
    IF p_square_meters IS NOT NULL AND existing_prop.square_meters IS NOT NULL THEN
      IF ABS(p_square_meters - existing_prop.square_meters) <= (GREATEST(p_square_meters, existing_prop.square_meters) * 0.05) THEN
        specs_similarity := specs_similarity + 0.3;
      END IF;
    END IF;
    
    -- Calculate overall score
    overall_score := (title_similarity * 0.3) + (addr_similarity * 0.5) + (specs_similarity * 0.2);
    
    -- Build reasons array
    IF title_similarity >= 0.8 THEN
      reasons := array_append(reasons, 'similar_title');
    END IF;
    IF addr_similarity >= 0.9 THEN
      reasons := array_append(reasons, 'same_address');
    ELSIF addr_similarity >= 0.7 THEN
      reasons := array_append(reasons, 'similar_address');
    END IF;
    IF specs_similarity >= 0.5 THEN
      reasons := array_append(reasons, 'similar_specifications');
    END IF;
    
    -- Return if above threshold
    IF overall_score >= similarity_threshold AND array_length(reasons, 1) >= 1 THEN
      RETURN QUERY
      SELECT existing_prop.id, overall_score, reasons;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_duplicate_groups_status ON public.global_duplicate_groups(status);
CREATE INDEX IF NOT EXISTS idx_global_duplicate_groups_confidence ON public.global_duplicate_groups(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_global_duplicate_groups_created_at ON public.global_duplicate_groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_global_duplicate_properties_group_id ON public.global_duplicate_properties(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_global_duplicate_properties_property_id ON public.global_duplicate_properties(property_id);

CREATE INDEX IF NOT EXISTS idx_duplicate_detection_log_action_type ON public.duplicate_detection_log(action_type);
CREATE INDEX IF NOT EXISTS idx_duplicate_detection_log_created_at ON public.duplicate_detection_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_duplicate_detection_log_admin_user ON public.duplicate_detection_log(admin_user_id);

-- Add comments for documentation
COMMENT ON TABLE public.duplicate_detection_settings IS 'Configuration settings for duplicate detection algorithms and thresholds';
COMMENT ON TABLE public.property_media_hashes IS 'Perceptual hashes of property images for duplicate detection';
COMMENT ON TABLE public.duplicate_false_positives IS 'Track properties that were incorrectly flagged as duplicates';
COMMENT ON TABLE public.merged_properties_tracking IS 'Track properties that have been merged to prevent re-import of duplicates';

COMMENT ON FUNCTION public.get_duplicate_detection_stats(UUID) IS 'Get comprehensive statistics about duplicate detection system';
COMMENT ON FUNCTION public.check_potential_duplicate IS 'Check if a new property might be a duplicate before creation';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.duplicate_detection_settings TO authenticated;
GRANT ALL ON public.property_media_hashes TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_potential_duplicate TO authenticated;