/*
# Log lucky-wheel item rewards in transaction history

1. Purpose
- Currently `spin_wheel()` only inserts a row into `transactions` for currency rewards (Hua Tien, Cong Duc, Am Duc).
- Shop-item and special-prize rewards are logged in `wheel_spin_log` but NOT in `transactions`, so they don't appear in the player's "Lich Su Giao Dich" on their profile.
- The user wants every wheel outcome — currency gain or item reward — to show in the transaction history.

2. Changes
- Recreated `spin_wheel()` (dropped then recreated because the OUT-parameter row type differs from the existing definition) to also INSERT into `transactions` when the reward is a SHOP item or SPECIAL prize.
  - amount = 0 (no currency change)
  - currency_type = 'HUA_TIEN' (placeholder — the column is NOT NULL; amount 0 means no actual currency impact)
  - reason = 'Vong quay may man: <reward_label>'
- Re-applied grants: REVOKE from anon/public, GRANT to authenticated.

3. Security
- No new tables, no policy changes. The function is SECURITY DEFINER and only callable by authenticated users.

4. Notes
- Safe to re-run (DROP FUNCTION IF EXISTS + CREATE OR REPLACE).
- MISS results are intentionally NOT logged to transactions (nothing was gained).
*/

DROP FUNCTION IF EXISTS public.spin_wheel();

CREATE FUNCTION public.spin_wheel()
RETURNS TABLE (
  reward_key text,
  reward_label text,
  reward_group text,
  is_special boolean,
  currency text,
  amount int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_roll float;
  v_group text;
  v_sub_roll float;
  v_reward_key text;
  v_reward_label text;
  v_reward_group text;
  v_is_special boolean := false;
  v_currency text := '';
  v_amount int := 0;
  v_stock_id int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND wheel_spins > 0) THEN
    RAISE EXCEPTION 'Khong con luot quay';
  END IF;

  UPDATE public.profiles SET wheel_spins = wheel_spins - 1 WHERE id = v_uid;

  v_roll := random();
  v_sub_roll := random();

  IF v_roll < 0.40 THEN
    v_group := 'MISS';
  ELSIF v_roll < 0.70 THEN
    v_group := 'HUA_TIEN';
  ELSIF v_roll < 0.85 THEN
    v_group := 'CONG_DUC';
  ELSIF v_roll < 0.93 THEN
    v_group := 'AM_DUC';
  ELSIF v_roll < 0.98 THEN
    v_group := 'SHOP';
  ELSE
    v_group := 'SPECIAL';
  END IF;

  IF v_group = 'SPECIAL' THEN
    PERFORM 1 FROM public.profiles WHERE id = v_uid AND wheel_special_claimed = true;
    IF FOUND THEN
      v_group := 'MISS';
    END IF;
  END IF;

  IF v_group = 'MISS' THEN
    v_reward_key := 'MISS';
    v_reward_label := 'Chuc ban may man lan sau';
    v_reward_group := 'MISS';

  ELSIF v_group = 'HUA_TIEN' THEN
    v_currency := 'HUA_TIEN';
    IF v_sub_roll < 0.7042 THEN
      v_amount := 50;
    ELSIF v_sub_roll < 0.9859 THEN
      v_amount := 100;
    ELSE
      v_amount := 500;
    END IF;
    v_reward_key := 'HUA_TIEN_' || v_amount;
    v_reward_label := v_amount || ' Hoa Tien';
    v_reward_group := 'Hoa Tien';

  ELSIF v_group = 'CONG_DUC' THEN
    v_currency := 'CONG_DUC';
    IF v_sub_roll < 0.6757 THEN
      v_amount := 5;
    ELSIF v_sub_roll < 0.9460 THEN
      v_amount := 10;
    ELSE
      v_amount := 100;
    END IF;
    v_reward_key := 'CONG_DUC_' || v_amount;
    v_reward_label := v_amount || ' Cong Duc';
    v_reward_group := 'Cong Duc';

  ELSIF v_group = 'AM_DUC' THEN
    v_currency := 'AM_DUC';
    IF v_sub_roll < 0.6667 THEN
      v_amount := 5;
    ELSE
      v_amount := 50;
    END IF;
    v_reward_key := 'AM_DUC_' || v_amount;
    v_reward_label := v_amount || ' Am Duc';
    v_reward_group := 'Am Duc';

  ELSIF v_group = 'SHOP' THEN
    IF v_sub_roll < 0.50 THEN
      v_reward_key := 'SHOP_KV1';
    ELSIF v_sub_roll < 0.8571 THEN
      v_reward_key := 'SHOP_KV2';
    ELSE
      v_reward_key := 'SHOP_KV3';
    END IF;
    SELECT id, label INTO v_stock_id, v_reward_label
      FROM public.wheel_reward_stock
      WHERE reward_key = v_reward_key AND claimed < quantity
      LIMIT 1;
    IF v_stock_id IS NULL THEN
      SELECT id, label, reward_key INTO v_stock_id, v_reward_label, v_reward_key
        FROM public.wheel_reward_stock
        WHERE group_name = 'SHOP' AND claimed < quantity
        ORDER BY random()
        LIMIT 1;
    END IF;
    IF v_stock_id IS NULL THEN
      v_group := 'MISS';
      v_reward_key := 'MISS';
      v_reward_label := 'Chuc ban may man lan sau';
      v_reward_group := 'MISS';
    ELSE
      v_reward_group := 'Vat pham Thuong Thanh';
    END IF;

  ELSIF v_group = 'SPECIAL' THEN
    SELECT id, label, reward_key INTO v_stock_id, v_reward_label, v_reward_key
      FROM public.wheel_reward_stock
      WHERE is_special = true AND claimed < quantity
      ORDER BY random()
      LIMIT 1;
    IF v_stock_id IS NULL THEN
      v_group := 'MISS';
      v_reward_key := 'MISS';
      v_reward_label := 'Chuc ban may man lan sau';
      v_reward_group := 'MISS';
    ELSE
      v_is_special := true;
      v_reward_group := 'Qua Dac Biet';
      UPDATE public.profiles SET wheel_special_claimed = true WHERE id = v_uid;
    END IF;
  END IF;

  IF v_group = 'HUA_TIEN' OR v_group = 'CONG_DUC' OR v_group = 'AM_DUC' THEN
    IF v_currency = 'HUA_TIEN' THEN
      UPDATE public.profiles SET hua_tien = hua_tien + v_amount WHERE id = v_uid;
    ELSIF v_currency = 'CONG_DUC' THEN
      UPDATE public.profiles SET cong_duc = cong_duc + v_amount WHERE id = v_uid;
    ELSIF v_currency = 'AM_DUC' THEN
      UPDATE public.profiles SET am_duc = am_duc + v_amount WHERE id = v_uid;
    END IF;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, v_amount, v_currency, 'Vòng quay may mắn');
  END IF;

  IF v_stock_id IS NOT NULL AND (v_group = 'SHOP' OR v_group = 'SPECIAL') THEN
    UPDATE public.wheel_reward_stock
      SET claimed = claimed + 1
      WHERE id = v_stock_id;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, 0, 'HUA_TIEN', 'Vòng quay may mắn: ' || v_reward_label);
  END IF;

  INSERT INTO public.wheel_spin_log (user_id, reward_key, reward_label, reward_group, is_special)
    VALUES (v_uid, v_reward_key, v_reward_label, v_reward_group, v_is_special);

  RETURN QUERY
    SELECT v_reward_key, v_reward_label, v_reward_group, v_is_special, v_currency, v_amount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM anon;
REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;
