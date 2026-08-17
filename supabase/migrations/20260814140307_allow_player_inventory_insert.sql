/*
# Allow players to insert items into their own inventory

1. Purpose
- Currently `inventories` only has a SELECT policy for owners and INSERT/SELECT for admins.
- When a player buys from the shop, the app inserts purchased items into `inventories` — but there is no INSERT policy for the owner, so RLS silently blocks the insert and items never appear in the player's inventory.
- This adds an owner-scoped INSERT policy so purchased items land in the buyer's inventory.

2. Changes
- Added `inventories_insert_own` INSERT policy: authenticated users can insert rows where `user_id = auth.uid()`.

3. Security
- Owner-scoped: players can only insert into their own inventory, not anyone else's.
- No UPDATE or DELETE policy added — players still cannot remove or modify inventory rows (only admins can insert/grant).

4. Notes
- Idempotent: DROP POLICY IF EXISTS before CREATE.
*/

DROP POLICY IF EXISTS "inventories_insert_own" ON public.inventories;
CREATE POLICY "inventories_insert_own" ON public.inventories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
