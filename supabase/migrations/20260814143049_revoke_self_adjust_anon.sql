/*
# Revoke self_adjust_currency from anon

1. Purpose
- self_adjust_currency uses auth.uid() which is NULL for anon, so it would always
  fail anyway. But granting EXECUTE to anon is unnecessary surface area.
- Keep it restricted to authenticated only.

2. Security
- No behavior change for authenticated users.
- anon can no longer call this function (it would have errored regardless).
*/

REVOKE EXECUTE ON FUNCTION public.self_adjust_currency(int, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.self_adjust_currency(int, text, text) FROM PUBLIC;
