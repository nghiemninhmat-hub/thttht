/*
# Grant UPDATE on currency columns to authenticated users

1. Purpose
- The `profiles_update_own` RLS policy allows users to UPDATE their own row, but the underlying column-level GRANT for `hua_tien`, `cong_duc`, `am_duc` is missing UPDATE.
- This means shop checkout silently fails: the profile update returns success but changes nothing (or errors), so currency is never deducted.
- This grants UPDATE on the currency columns (and wheel_spins, wheel_special_claimed which the spin_wheel SECURITY DEFINER function handles, but having the grant is harmless and consistent).

2. Changes
- GRANT UPDATE (hua_tien, cong_duc, am_duc, wheel_spins, wheel_special_claimed) ON profiles TO authenticated.

3. Security
- RLS still enforces that users can only UPDATE their own row (profiles_update_own policy).
- The column grant only allows updating these specific columns, not arbitrary ones like is_approved or email.

4. Notes
- Idempotent: GRANT is safe to re-run.
*/

GRANT UPDATE (hua_tien, cong_duc, am_duc, wheel_spins, wheel_special_claimed) ON public.profiles TO authenticated;
