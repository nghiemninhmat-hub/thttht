/*
# Admin Helper Function and Admin-Level Policies

1. Helper Function
- `is_admin()`: SECURITY DEFINER function that checks if the current user's email is in the admin allowlist. Used by RLS policies for admin-only operations.

2. Admin Policies Added
- profiles: admin can update any profile (approve accounts, manage currencies)
- transactions: admin can read all transactions and insert new ones
- shop_items: admin can insert, update, delete items
- inventories: admin can insert (grant items to players)
- site_pages: admin can insert, update, delete pages
*/

-- Helper function to check admin status (created after profiles table exists)
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

-- Admin can update any profile (approve accounts, manage currencies)
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can read all transactions
DROP POLICY IF EXISTS "transactions_admin_select" ON public.transactions;
CREATE POLICY "transactions_admin_select" ON public.transactions FOR SELECT
  TO authenticated USING (public.is_admin());

-- Admin can insert transactions
DROP POLICY IF EXISTS "transactions_admin_insert" ON public.transactions;
CREATE POLICY "transactions_admin_insert" ON public.transactions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Admin can insert shop items
DROP POLICY IF EXISTS "shop_items_admin_insert" ON public.shop_items;
CREATE POLICY "shop_items_admin_insert" ON public.shop_items FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Admin can update shop items
DROP POLICY IF EXISTS "shop_items_admin_update" ON public.shop_items;
CREATE POLICY "shop_items_admin_update" ON public.shop_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can delete shop items
DROP POLICY IF EXISTS "shop_items_admin_delete" ON public.shop_items;
CREATE POLICY "shop_items_admin_delete" ON public.shop_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- Admin can insert inventory items (grant items)
DROP POLICY IF EXISTS "inventories_admin_insert" ON public.inventories;
CREATE POLICY "inventories_admin_insert" ON public.inventories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Admin can read all inventories
DROP POLICY IF EXISTS "inventories_admin_select" ON public.inventories;
CREATE POLICY "inventories_admin_select" ON public.inventories FOR SELECT
  TO authenticated USING (public.is_admin());

-- Admin can insert site pages
DROP POLICY IF EXISTS "site_pages_admin_insert" ON public.site_pages;
CREATE POLICY "site_pages_admin_insert" ON public.site_pages FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Admin can update site pages
DROP POLICY IF EXISTS "site_pages_admin_update" ON public.site_pages;
CREATE POLICY "site_pages_admin_update" ON public.site_pages FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can delete site pages
DROP POLICY IF EXISTS "site_pages_admin_delete" ON public.site_pages;
CREATE POLICY "site_pages_admin_delete" ON public.site_pages FOR DELETE
  TO authenticated USING (public.is_admin());
