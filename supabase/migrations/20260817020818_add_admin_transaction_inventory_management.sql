/*
# Admin transaction and inventory management policies

Adds missing RLS policies so admins can:
- UPDATE transactions (edit transaction records)
- DELETE transactions (remove transaction records)
- DELETE inventory items (revoke/remove items from player inventories)

These complement the existing admin SELECT/INSERT policies.
*/

-- Admin can update transactions (edit reason, amount, etc.)
DROP POLICY IF EXISTS "transactions_admin_update" ON public.transactions;
CREATE POLICY "transactions_admin_update" ON public.transactions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can delete transactions
DROP POLICY IF EXISTS "transactions_admin_delete" ON public.transactions;
CREATE POLICY "transactions_admin_delete" ON public.transactions FOR DELETE
  TO authenticated USING (public.is_admin());

-- Admin can delete inventory items (revoke items from players)
DROP POLICY IF EXISTS "inventories_admin_delete" ON public.inventories;
CREATE POLICY "inventories_admin_delete" ON public.inventories FOR DELETE
  TO authenticated USING (public.is_admin());

-- Admin can update inventory items
DROP POLICY IF EXISTS "inventories_admin_update" ON public.inventories;
CREATE POLICY "inventories_admin_update" ON public.inventories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
