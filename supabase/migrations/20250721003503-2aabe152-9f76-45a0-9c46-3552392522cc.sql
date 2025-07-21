-- Fix the security definer view by recreating it without SECURITY DEFINER
DROP VIEW IF EXISTS public.deepsource_issue_stats;

-- Create a normal view (not SECURITY DEFINER)
CREATE VIEW public.deepsource_issue_stats AS
SELECT 
  category,
  severity,
  status,
  COUNT(*) as issue_count,
  SUM(occurrence_count) as total_occurrences,
  SUM(file_count) as total_files_affected
FROM public.deepsource_issues
GROUP BY category, severity, status;

-- Fix remaining functions with search_path
CREATE OR REPLACE FUNCTION public.check_potential_duplicate(p_title text, p_street_name text, p_street_number text, p_city text, p_zip_code text, p_monthly_rent numeric, p_bedrooms integer, p_square_meters numeric, similarity_threshold numeric DEFAULT 0.85)
 RETURNS TABLE(property_id uuid, similarity_score numeric, match_reasons text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Fix get_duplicate_detection_stats function
CREATE OR REPLACE FUNCTION public.get_duplicate_detection_stats(admin_user_id uuid)
 RETURNS TABLE(total_groups integer, pending_groups integer, resolved_groups integer, dismissed_groups integer, high_confidence_groups integer, recent_scans integer, last_scan_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;