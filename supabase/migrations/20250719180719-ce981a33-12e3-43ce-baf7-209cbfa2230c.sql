-- Fix security issues by updating functions with proper search_path

-- Update changepassword function with secure search_path
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

-- Update has_role function with secure search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update get_current_user_role function with secure search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Update generate_property_fingerprint function with secure search_path
CREATE OR REPLACE FUNCTION public.generate_property_fingerprint(
  p_title text,
  p_street_name text,
  p_street_number text,
  p_zip_code text,
  p_city text,
  p_monthly_rent numeric,
  p_bedrooms integer,
  p_square_meters numeric
)
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