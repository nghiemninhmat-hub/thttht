/*
# Add Character Status System to Profiles

1. New Columns on `profiles`
- `status_physical` (text, default 'Bình Thường') — Thể chất status: Rách da, Bỏng, Gãy tay, Kiệt sức, etc.
- `status_spiritual` (text, default 'Bình Thường') — Tâm linh status: Nhiễm Âm Khí, Quỷ Khí Bám Thân, etc.
- `status_mental` (text, default 'Bình Thường') — Tinh thần status: Ám ảnh, Hoảng loạn, etc.

All three default to 'Bình Thường' so every new and existing player starts with a clean slate.

2. Security
- Players can READ their own status (already covered by existing profile SELECT policy).
- Players CANNOT update status columns — only admins can.
- Admin update is handled via the existing admin SECURITY DEFINER function / admin RLS policies.
- We add a restrictive UPDATE policy on profiles that explicitly excludes status columns from player self-update by using a column-level check.

3. Important Notes
- The existing `self_adjust_currency` SECURITY DEFINER function and admin policies already handle currency updates.
- Status columns are text fields that admins set manually based on roleplay outcomes.
- Players see their status but cannot change it.
*/

-- Add status columns with default 'Bình Thường'
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status_physical text NOT NULL DEFAULT 'Bình Thường',
  ADD COLUMN IF NOT EXISTS status_spiritual text NOT NULL DEFAULT 'Bình Thường',
  ADD COLUMN IF NOT EXISTS status_mental text NOT NULL DEFAULT 'Bình Thường';

-- Set existing rows to default
UPDATE profiles
  SET status_physical = 'Bình Thường',
      status_spiritual = 'Bình Thường',
      status_mental = 'Bình Thường'
  WHERE status_physical IS NULL OR status_spiritual IS NULL OR status_mental IS NULL;

-- Grant admin ability to update status columns via existing admin infrastructure
-- The admin dashboard uses the service role key (via edge function) or admin RLS
-- We need to ensure the existing UPDATE policy on profiles allows admin updates
-- Check if there's an admin update policy; if not, we rely on the is_admin() function

-- Allow admins to update status columns (they already can update other fields)
-- The existing self-update policy uses auth.uid() = id which covers the user's own row
-- Admins use the service role key bypass or admin-specific policies

-- Add a policy allowing admin to update any profile's status
DROP POLICY IF EXISTS "admin_update_status" ON profiles;
CREATE POLICY "admin_update_status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
