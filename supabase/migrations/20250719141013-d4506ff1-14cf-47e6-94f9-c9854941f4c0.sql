-- Enable pgcrypto extension for password hashing
create extension if not exists pgcrypto;

-- Create RPC function to verify current password and update to new password
create or replace function changepassword(
  current_plain_password text,
  new_plain_password text,
  current_id uuid
)
returns varchar
language plpgsql
security definer
as $$
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