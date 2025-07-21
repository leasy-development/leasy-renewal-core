-- Fix remaining security definer functions

-- 5. Fix changepassword function
CREATE OR REPLACE FUNCTION public.changepassword(current_plain_password text, new_plain_password text, current_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  encpass auth.users.encrypted_password%type;
begin
  -- Verify current password
  select encrypted_password into encpass
  from auth.users
  where id = current_id
    and encrypted_password = crypt(current_plain_password, encrypted_password);

  if not found then
    return 'incorrect';
  else
    -- Update to new password
    update auth.users
    set encrypted_password = crypt(new_plain_password, gen_salt('bf'))
    where id = current_id;
    return 'success';
  end if;
end;
$function$;

-- 6. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, preferred_language)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN new;
END;
$function$;

-- 7. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 8. Fix other utility functions
CREATE OR REPLACE FUNCTION public.generate_property_fingerprint(p_title text, p_street_name text, p_street_number text, p_zip_code text, p_city text, p_monthly_rent numeric, p_bedrooms integer, p_square_meters numeric)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path = 'public'
AS $function$
  SELECT md5(
    COALESCE(lower(trim(p_title)), '') || '|' ||
    COALESCE(lower(trim(p_street_name)), '') || '|' ||
    COALESCE(lower(trim(p_street_number)), '') || '|' ||
    COALESCE(lower(trim(p_zip_code)), '') || '|' ||
    COALESCE(lower(trim(p_city)), '') || '|' ||
    COALESCE(p_monthly_rent::text, '0') || '|' ||
    COALESCE(p_bedrooms::text, '0') || '|' ||
    COALESCE(p_square_meters::text, '0')
  )
$function$;