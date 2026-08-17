/*
# Add moderator email and danh_vong column

1. Changes to is_admin()
- Add 'dungchikienn@gmail.com' to the admin email allowlist inside is_admin().
- This grants the new moderator full admin RLS permissions.

2. New Columns
- `profiles.danh_vong` (text, nullable) — danh vọng / title displayed on profile.
  Examples: "BAN QUẢN LÝ" for moderators, null for regular players.

3. Data Updates
- Set danh_vong = 'BAN QUẢN LÝ' for profiles matching the two moderator emails:
  thanhhuyenbsc@gmail.com and dungchikienn@gmail.com.

4. Security
- danh_vong is admin-controlled only. Add a column-level UPDATE grant restricted
  to admin via the existing profiles_admin_update_all policy (is_admin()).
- No new RLS policy needed — the existing admin UPDATE policy on profiles
  already covers all columns including the new one.

5. Important Notes
- The app has a sign-in screen, so admin checks use is_admin() with auth.uid().
- danh_vong is read-only for players (displayed on their profile) and editable
  only by admins through the admin dashboard.
*/

-- 1. Update is_admin() to include the new moderator email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND email IN (
      'kinhnha010@gmail.com',
      'hamthien53@gmail.com',
      'Ngoncanhtac001@gmail.com',
      'thanhhuyenbsc@gmail.com',
      'dungchikienn@gmail.com'
    )
  );
$$;

-- Re-grant: revoke from anon/public, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Add danh_vong column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'danh_vong'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN danh_vong text;
  END IF;
END $$;

-- 3. Set danh_vong for the two moderators
UPDATE public.profiles
SET danh_vong = 'BAN QUẢN LÝ'
WHERE email IN ('thanhhuyenbsc@gmail.com', 'dungchikienn@gmail.com');
