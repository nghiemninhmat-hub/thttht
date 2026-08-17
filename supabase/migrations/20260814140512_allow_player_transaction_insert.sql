/*
# Allow players to insert their own transaction records

1. Purpose
- Currently `transactions` only has a SELECT policy for owners. There is no INSERT policy for authenticated users.
- When a player buys from the shop, the app inserts transaction rows (currency deductions) — but RLS silently blocks the insert, so purchase records never appear in the player's transaction history.
- This adds an owner-scoped INSERT policy so purchase transactions are recorded.

2. Changes
- Added `transactions_insert_own` INSERT policy: authenticated users can insert rows where `user_id = auth.uid()`.

3. Security
- Owner-scoped: players can only insert transactions for themselves, not anyone else.
- No UPDATE or DELETE policy added — transactions are immutable once created (append-only audit log).

4. Notes
- Idempotent: DROP POLICY IF EXISTS before CREATE.
*/

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
