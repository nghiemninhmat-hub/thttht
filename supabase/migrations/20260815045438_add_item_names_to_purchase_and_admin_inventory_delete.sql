/*
# Log item names in purchase transactions + admin inventory management

1. Purpose
- Currently `purchase_items` logs a generic reason "Mua sắm thương thành" with no item names, so admins and players cannot see WHAT was bought in the transaction history.
- Admins can INSERT into `inventories` (grant items) but have no DELETE policy, so they cannot remove items from a player's inventory.
- This migration fixes both: purchase transactions now list item names, and admins gain DELETE on inventories.

2. Changes to purchase_items function
- Replaces the generic transaction reason with a per-currency summary that includes the purchased item names, e.g. "Mua sắm: Bùa Trấn Yểm, Linh Dược Hồi Sinh — 150 Hoa Tiền".
- One transaction row per currency type spent, as before, but now the `reason` field contains the item names and the total for that currency.
- Behavior is otherwise unchanged: atomic, SECURITY DEFINER, same balance checks and deductions.

3. Security changes
- Adds `inventories_admin_delete` policy: admin (is_admin()) can DELETE any inventory row, enabling item removal from player inventories.
- No new INSERT/UPDATE policies; existing owner-scoped INSERT and admin INSERT remain.

4. Notes
- Safe to re-run: DROP FUNCTION IF EXISTS first; DROP POLICY IF EXISTS before CREATE.
- Does NOT use BEGIN/COMMIT — the function body is implicitly a transaction.
- Does NOT drop or alter any columns or tables — no data loss risk.
*/

-- Recreate purchase_items with item-name logging
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
  v_item_names text := '';
  v_reason_hua text;
  v_reason_cong text;
  v_reason_am text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_item_ids IS NULL OR array_length(p_item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Không có vật phẩm để mua';
  END IF;

  -- Sum costs per currency and collect item names
  FOR v_item IN
    SELECT id, name, price, currency_type, price_secondary, currency_type_secondary
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

    -- Build comma-separated item name list
    IF v_item_names = '' THEN
      v_item_names := v_item.name;
    ELSE
      v_item_names := v_item_names || ', ' || v_item.name;
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

  -- Log transactions with item names in the reason
  IF v_hua_tien > 0 THEN
    v_reason_hua := 'Mua sắm: ' || v_item_names || ' — ' || v_hua_tien || ' Hoa Tiền';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_hua_tien, 'HUA_TIEN', v_reason_hua);
  END IF;
  IF v_cong_duc > 0 THEN
    v_reason_cong := 'Mua sắm: ' || v_item_names || ' — ' || v_cong_duc || ' Công Đức';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_cong_duc, 'CONG_DUC', v_reason_cong);
  END IF;
  IF v_am_duc > 0 THEN
    v_reason_am := 'Mua sắm: ' || v_item_names || ' — ' || v_am_duc || ' Âm Đức';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_am_duc, 'AM_DUC', v_reason_am);
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

-- Admin can delete inventory items (remove from player's inventory)
DROP POLICY IF EXISTS "inventories_admin_delete" ON public.inventories;
CREATE POLICY "inventories_admin_delete" ON public.inventories FOR DELETE
  TO authenticated USING (public.is_admin());
