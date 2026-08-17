/*
# Atomic purchase function for shop checkout

1. Purpose
- Currently checkout does 4 separate client-side calls (update profile, insert inventory, insert transactions, delete cart). If any step fails, the database is left in an inconsistent state — e.g. currency deducted but items never added to inventory.
- This creates a single `purchase_items(item_ids uuid[])` RPC function that does the entire purchase atomically in one transaction on the server.

2. What the function does
- Accepts an array of shop_item UUIDs (from cart or direct buy).
- Looks up each item's price, currency_type, price_secondary, currency_type_secondary from `shop_items`.
- Sums the total cost per currency type (HUA_TIEN, CONG_DUC, AM_DUC).
- Checks the caller's profile has enough of each currency. If not, raises an error and nothing changes.
- Deducts the currencies from `profiles`.
- Inserts one row per item into `inventories`.
- Inserts one transaction row per currency type that was spent (negative amount, reason 'Mua sắm thương thành').
- Deletes the caller's cart rows for the purchased items (so cart clears after checkout).
- Returns a summary: total_hua_tien, total_cong_duc, total_am_duc, item_count.

3. Security
- SECURITY DEFINER so it can write to inventories and transactions (which the client has INSERT policies for, but this is cleaner and atomic).
- REVOKE EXECUTE from anon and PUBLIC; GRANT only to authenticated.
- Uses `auth.uid()` for the caller identity — no user_id parameter to forge.

4. Notes
- Safe to re-run: DROP FUNCTION IF EXISTS first.
- Does NOT use BEGIN/COMMIT — the function body is implicitly a transaction.
- If any step fails, the entire function rolls back (PL/pgSQL atomicity).
*/

DROP FUNCTION IF EXISTS public.purchase_items(uuid[]);

CREATE FUNCTION public.purchase_items(p_item_ids uuid[])
RETURNS TABLE (
  item_count int,
  total_hua_tien int,
  total_cong_duc int,
  total_am_duc int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hua_tien int := 0;
  v_cong_duc int := 0;
  v_am_duc int := 0;
  v_profile_hua_tien int;
  v_profile_cong_duc int;
  v_profile_am_duc int;
  v_item record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_item_ids IS NULL OR array_length(p_item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Không có vật phẩm để mua';
  END IF;

  -- Sum costs per currency
  FOR v_item IN
    SELECT price, currency_type, price_secondary, currency_type_secondary
    FROM public.shop_items
    WHERE id = ANY(p_item_ids)
  LOOP
    IF v_item.currency_type = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price;
    ELSIF v_item.currency_type = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price;
    ELSIF v_item.currency_type = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price;
    END IF;

    IF v_item.price_secondary IS NOT NULL AND v_item.currency_type_secondary IS NOT NULL THEN
      IF v_item.currency_type_secondary = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price_secondary;
      ELSIF v_item.currency_type_secondary = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price_secondary;
      ELSIF v_item.currency_type_secondary = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price_secondary;
      END IF;
    END IF;
  END LOOP;

  -- Check balance
  SELECT hua_tien, cong_duc, am_duc INTO v_profile_hua_tien, v_profile_cong_duc, v_profile_am_duc
    FROM public.profiles WHERE id = v_uid;

  IF v_profile_hua_tien IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi';
  END IF;

  IF v_hua_tien > v_profile_hua_tien OR v_cong_duc > v_profile_cong_duc OR v_am_duc > v_profile_am_duc THEN
    RAISE EXCEPTION 'Không đủ tài sản để thanh toán';
  END IF;

  -- Deduct currency
  UPDATE public.profiles
    SET hua_tien = hua_tien - v_hua_tien,
        cong_duc = cong_duc - v_cong_duc,
        am_duc = am_duc - v_am_duc
    WHERE id = v_uid;

  -- Add items to inventory
  INSERT INTO public.inventories (user_id, item_id)
    SELECT v_uid, id FROM public.shop_items WHERE id = ANY(p_item_ids);

  -- Log transactions
  IF v_hua_tien > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_hua_tien, 'HUA_TIEN', 'Mua sắm thương thành');
  END IF;
  IF v_cong_duc > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_cong_duc, 'CONG_DUC', 'Mua sắm thương thành');
  END IF;
  IF v_am_duc > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_am_duc, 'AM_DUC', 'Mua sắm thương thành');
  END IF;

  -- Clear purchased items from cart
  DELETE FROM public.carts
    WHERE user_id = v_uid AND item_id = ANY(p_item_ids);

  RETURN QUERY
    SELECT
      array_length(p_item_ids, 1),
      v_hua_tien,
      v_cong_duc,
      v_am_duc;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_items(uuid[]) TO authenticated;
