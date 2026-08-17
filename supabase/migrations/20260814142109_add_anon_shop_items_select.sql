/*
# Add anon SELECT policy for shop_items

1. Purpose
- The `shop_items` table currently has a SELECT policy only for `TO authenticated`.
- Unauthenticated users browsing the shop (`/shop` route is public) see no items because RLS blocks anon reads.
- This adds an anon SELECT policy so public shop browsing works.

2. Security
- shop_items are intentionally public catalog data (name, price, description) — no sensitive user data.
- INSERT/UPDATE/DELETE remain admin-only.

3. Notes
- Idempotent: DROP POLICY IF EXISTS first.
*/

DROP POLICY IF EXISTS "shop_items_select_all" ON public.shop_items;
CREATE POLICY "shop_items_select_all"
ON public.shop_items FOR SELECT
TO anon, authenticated
USING (true);
