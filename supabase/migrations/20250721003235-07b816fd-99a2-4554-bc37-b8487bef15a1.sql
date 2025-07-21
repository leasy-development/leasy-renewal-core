-- Fix critical security vulnerabilities in database functions

-- 1. Fix security definer functions by adding proper search path
CREATE OR REPLACE FUNCTION public.update_field_mapping_suggestions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.field_mapping_suggestions (source_field, target_field, score, usage_count)
  VALUES (NEW.source_field, NEW.target_field, NEW.match_confidence, 1)
  ON CONFLICT (source_field, target_field)
  DO UPDATE SET
    score = GREATEST(field_mapping_suggestions.score, NEW.match_confidence),
    usage_count = field_mapping_suggestions.usage_count + 1,
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$function$;

-- 2. Fix create_duplicate_group function
CREATE OR REPLACE FUNCTION public.create_duplicate_group(p_confidence_score numeric, p_property_ids uuid[], p_similarity_reasons jsonb[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  group_id uuid;
  prop_id uuid;
  reasons jsonb;
  i integer;
BEGIN
  -- Create the duplicate group
  INSERT INTO public.global_duplicate_groups (
    confidence_score,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_confidence_score,
    'pending',
    now(),
    now()
  ) RETURNING id INTO group_id;

  -- Insert properties into the group
  i := 1;
  FOREACH prop_id IN ARRAY p_property_ids LOOP
    -- Get the corresponding reasons for this property
    IF i <= array_length(p_similarity_reasons, 1) THEN
      reasons := p_similarity_reasons[i];
    ELSE
      reasons := '[]'::jsonb;
    END IF;

    INSERT INTO public.global_duplicate_properties (
      duplicate_group_id,
      property_id,
      similarity_reasons,
      created_at
    ) VALUES (
      group_id,
      prop_id,
      reasons,
      now()
    );

    i := i + 1;
  END LOOP;

  RETURN group_id;
END;
$function$;

-- 3. Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'moderator' THEN 2 
      WHEN 'user' THEN 3 
    END
  LIMIT 1
$function$;

-- 4. Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;