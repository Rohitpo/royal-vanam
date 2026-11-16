-- Create a customer profile and retail customer record when Supabase Auth creates a user.
-- The role is intentionally fixed here; client-provided metadata must never grant elevated roles.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_user_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX customers_profile_id_unique ON public.customers(profile_id);

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
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
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
