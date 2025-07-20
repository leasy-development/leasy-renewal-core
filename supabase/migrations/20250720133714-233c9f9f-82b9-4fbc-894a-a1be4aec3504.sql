-- Fix Function Search Path Mutable warnings by updating functions to have proper search_path

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update has_role function  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update changepassword function
CREATE OR REPLACE FUNCTION public.changepassword(current_plain_password text, new_plain_password text, current_id uuid)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, preferred_language)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN new;
END;
$$;