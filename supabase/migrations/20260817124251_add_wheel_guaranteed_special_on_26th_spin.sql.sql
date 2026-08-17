/*
# Guaranteed Special Reward on 26th Wheel Spin

1. Overview
- Changes the lucky wheel so that the "Quà Đặc Biệt" (special reward) is no longer random.
- Instead, each account must complete 25 spins; on the 26th spin the special reward is guaranteed.
- Each account can only win the special reward once. After claiming, the counter keeps going but special is excluded from the pool.
- Removes the old 2% random SPECIAL tier from the roll table; the SPECIAL group is now granted deterministically based on spin count.

2. New column on `profiles`
- `wheel_total_spins` int NOT NULL DEFAULT 0 — total number of spins ever performed by this account (does not decrease).

3. Changes to `spin_wheel()`
- Increments `wheel_total_spins` atomically alongside the spin decrement.
- The top-level roll no longer includes SPECIAL as a random outcome (rates redistributed).
- After the roll, if `wheel_total_spins >= 26` AND `wheel_special_claimed = false` AND special stock is available, the result is overridden to SPECIAL.
- On special win: sets `wheel_special_claimed = true` and increments claimed on the stock row (unchanged behavior).

4. Rate redistribution (random tiers, excluding SPECIAL)
- MISS: 30% (unchanged)
- HUA_TIEN: 20% (unchanged)
- CONG_DUC: 28% (unchanged)
- AM_DUC: 7% (unchanged)
- SHOP: 15% (unchanged, was 13% — the 2% SPECIAL slice is folded into SHOP)
- SPECIAL is no longer in the random roll.

5. Security
- No policy changes. `wheel_total_spins` is added to the column-level REVOKE (not client-writable).
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wheel_total_spins int NOT NULL DEFAULT 0;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  avatar_url, bio, anonymous_name, anonymous_name_changes
) ON public.profiles TO authenticated;

DROP FUNCTION IF EXISTS public.spin_wheel();

CREATE FUNCTION public.spin_wheel()
RETURNS TABLE (
  reward_key text,
  reward_label text,
  reward_group text,
  is_special boolean,
  currency_type text,
  amount int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_spins int;
  v_total_spins int;
  v_special_claimed boolean;
  v_roll float;
  v_group text;
  v_sub_roll float;
  v_reward_key text;
  v_reward_label text;
  v_reward_group text;
  v_is_special boolean := false;
  v_currency text;
  v_amount int := 0;
  v_stock_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Atomically decrement spins and increment total; only proceeds if a spin was available
  UPDATE public.profiles
    SET wheel_spins = wheel_spins - 1,
        wheel_total_spins = wheel_total_spins + 1
    WHERE id = v_uid AND wheel_spins > 0
    RETURNING wheel_spins, wheel_total_spins, wheel_special_claimed INTO v_spins, v_total_spins, v_special_claimed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bạn không có lượt quay nào';
  END IF;

  -- Pick the top-level group by rates (SPECIAL is no longer random)
  v_roll := random();
  IF v_roll < 0.30 THEN
    v_group := 'MISS';
  ELSIF v_roll < 0.50 THEN
    v_group := 'HUA_TIEN';
  ELSIF v_roll < 0.78 THEN
    v_group := 'CONG_DUC';
  ELSIF v_roll < 0.85 THEN
    v_group := 'AM_DUC';
  ELSE
    v_group := 'SHOP';
  END IF;

  -- If shop group, check if any shop stock remains; if not, downgrade to MISS
  IF v_group = 'SHOP' THEN
    PERFORM 1 FROM public.wheel_reward_stock
      WHERE group_name = 'SHOP' AND claimed < quantity
      LIMIT 1;
    IF NOT FOUND THEN
      v_group := 'MISS';
    END IF;
  END IF;

  v_sub_roll := random();

  IF v_group = 'MISS' THEN
    v_reward_key := 'MISS';
    v_reward_label := 'Chúc bạn may mắn lần sau';
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
    v_reward_label := v_amount || ' Hoa Tiền';
    v_reward_group := 'Hoa Tiền';

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
    v_reward_label := v_amount || ' Công Đức';
    v_reward_group := 'Công Đức';

  ELSIF v_group = 'AM_DUC' THEN
    v_currency := 'AM_DUC';
    IF v_sub_roll < 0.6667 THEN
      v_amount := 5;
    ELSE
      v_amount := 50;
    END IF;
    v_reward_key := 'AM_DUC_' || v_amount;
    v_reward_label := v_amount || ' Âm Đức';
    v_reward_group := 'Âm Đức';

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
      v_reward_label := 'Chúc bạn may mắn lần sau';
      v_reward_group := 'MISS';
    ELSE
      v_reward_group := 'Vật phẩm Thương Thành';
    END IF;
  END IF;

  -- Guaranteed special on the 26th spin (total >= 26), once per account
  IF v_total_spins >= 26 AND NOT v_special_claimed THEN
    SELECT id, label, reward_key INTO v_stock_id, v_reward_label, v_reward_key
      FROM public.wheel_reward_stock
      WHERE is_special = true AND claimed < quantity
      ORDER BY random()
      LIMIT 1;
    IF v_stock_id IS NOT NULL THEN
      v_group := 'SPECIAL';
      v_is_special := true;
      v_reward_group := 'Quà Đặc Biệt';
      v_currency := NULL;
      v_amount := 0;
      UPDATE public.profiles SET wheel_special_claimed = true WHERE id = v_uid;
    END IF;
  END IF;

  -- Apply rewards
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

  -- Decrement stock for shop / special
  IF v_stock_id IS NOT NULL AND (v_group = 'SHOP' OR v_group = 'SPECIAL') THEN
    UPDATE public.wheel_reward_stock
      SET claimed = claimed + 1
      WHERE id = v_stock_id;
  END IF;

  -- Log the spin
  INSERT INTO public.wheel_spin_log (user_id, reward_key, reward_label, reward_group, is_special)
    VALUES (v_uid, v_reward_key, v_reward_label, v_reward_group, v_is_special);

  RETURN QUERY
    SELECT v_reward_key, v_reward_label, v_reward_group, v_is_special, v_currency, v_amount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM anon;
REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;
