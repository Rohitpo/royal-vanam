-- Backfill profiles for Supabase Auth users created before the profile trigger existed.
-- This also repairs customer records and keeps future signups synchronized.

CREATE UNIQUE INDEX IF NOT EXISTS customers_profile_id_unique
  ON public.customers(profile_id);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'Royal Vanam Customer'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    'retail_customer'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW();

  INSERT INTO public.customers (profile_id, customer_type)
  VALUES (NEW.id, 'retail')
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.profiles (id, full_name, email, phone, role)
SELECT
  users.id,
  COALESCE(NULLIF(users.raw_user_meta_data ->> 'full_name', ''), 'Royal Vanam Customer'),
  users.email,
  users.raw_user_meta_data ->> 'phone',
  'retail_customer'::user_role
FROM auth.users AS users
WHERE users.email IS NOT NULL
ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      updated_at = NOW();

INSERT INTO public.customers (profile_id, customer_type)
SELECT users.id, 'retail'
FROM auth.users AS users
WHERE users.email IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;
