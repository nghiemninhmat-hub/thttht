/*
# Fix is_admin() execute permission for RLS policies

1. Problem
- Migration 20260814034055 revoked EXECUTE on is_admin() from authenticated.
- RLS policies on inventories, transactions, shop_items, and profiles call is_admin()
  in their USING clauses (admin select/insert/update/delete policies).
- When Postgres evaluates RLS, it evaluates ALL permissive policies for the role,
  including admin policies that call is_admin().
- Without EXECUTE permission, is_admin() raises "permission denied for function",
  causing the ENTIRE query to fail — even for non-admin users who should see their
  own rows via the _own policies.
- This is why players see no inventory and no transaction history: the query errors
  out silently (the client code swallowed the error).

2. Fix
- Make is_admin() SECURITY DEFINER so it runs as the function owner (postgres),
  bypassing the caller's lack of direct execute permission. This is safe because
  the function only reads profiles and checks email against a hardcoded admin list.
- Grant EXECUTE to authenticated so RLS policy evaluation can call it.
- Keep it revoked from anon and PUBLIC so unauthenticated users cannot probe.
- The function already has SET search_path = public (via the original definition),
  but we ensure it here explicitly.

3. Security
- SECURITY DEFINER is safe: the function only SELECTs from profiles and compares
  emails. It cannot be exploited to escalate privileges.
- anon/PUBLIC still have no EXECUTE, so the function cannot be called via REST API
  by unauthenticated users.
- Even if an authenticated non-admin calls is_admin() directly via RPC, it returns
  false — no information leak beyond what the UI already shows (admin tab visibility).
*/

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
      'thanhhuyenbsc@gmail.com'
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
