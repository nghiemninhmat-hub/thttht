-- Revoke EXECUTE on is_admin() from anon so unauthenticated users cannot probe admin status via REST API.
-- authenticated retains EXECUTE because RLS policies reference this function.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;