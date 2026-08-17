-- Revoke EXECUTE from authenticated too: RLS policies call is_admin() internally as the table owner,
-- so direct REST invocation is not needed. This prevents any signed-in user from probing admin status.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;