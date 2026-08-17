-- Remove PUBLIC EXECUTE grant on is_admin() so anon role (which inherits PUBLIC) cannot call it.
-- Keep explicit grants only for authenticated and service_role.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;