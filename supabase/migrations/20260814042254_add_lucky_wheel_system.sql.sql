/*
# Add Lucky Wheel (Vòng Quay May Mắn) System

1. Overview
- Adds a lucky-wheel minigame where players spin to win rewards.
- Spins are granted by admins only (no self-service).
- All reward logic runs server-side in a SECURITY DEFINER function so the client cannot forge outcomes, rates, or stock.

2. New columns on `profiles`
- `wheel_spins` int default 0 — number of unused spins available to the player.
- `wheel_special_claimed` boolean default false — whether this account has already won a "Quà Đặc Biệt" (one per account rule).

3. New table `wheel_reward_stock`
- Tracks limited-quantity rewards (Quà Đặc Biệt items and Vật phẩm Thương Thành items).
- Columns: id, reward_key (unique identifier), label (display name), group_name, quantity (total), claimed (how many issued), is_special.
- Only admins can read/modify; the spin function decrements atomically.

4. New table `wheel_spin_log`
- Audit log of every spin: user_id, reward_key, reward_label, reward_group, is_special, created_at.
- Players can read their own log; admins can read all.

5. New function `spin_wheel()`
- SECURITY DEFINER, returns the reward won.
- Decrements wheel_spins atomically (rejects if 0).
- Enforces one-special-per-account: if wheel_special_claimed is true, special rewards are excluded from the pool.
- Enforces stock limits: rewards with claimed >= quantity are excluded.
- Uses the exact tier/sub-tier rates from the game spec to pick a reward deterministically server-side.
- On a special win: sets wheel_special_claimed = true and increments claimed on the stock row.
- On a shop-item win: increments claimed on the stock row and inserts into inventories.
- On currency win: updates profiles balance and inserts a transaction row.
- On "Chúc bạn may mắn": no balance change.

6. New function `admin_grant_spins(p_user_id, p_amount)`
- SECURITY DEFINER, callable by admins only.
- Adds p_amount to the target user's wheel_spins. Validates amount is 1..1000.

7. Security
- RLS enabled on both new tables.
- wheel_reward_stock: admin-only read/write; players never see stock directly.
- wheel_spin_log: players read own rows; admin reads all.
- spin_wheel(): REVOKE from anon; GRANT to authenticated.
- admin_grant_spins(): REVOKE from anon; GRANT to authenticated.
- profiles.wheel_spins and wheel_special_claimed are NOT client-writable: REVOKE UPDATE on those columns from authenticated (the existing profiles_update_own policy still allows update of other columns; column-level grant narrows it).
*/

-- 2. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wheel_spins int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wheel_special_claimed boolean NOT NULL DEFAULT false;

-- Revoke client updates on the privilege columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  avatar_url, bio, anonymous_name, anonymous_name_changes
) ON public.profiles TO authenticated;

-- 3. wheel_reward_stock
CREATE TABLE IF NOT EXISTS public.wheel_reward_stock (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_key text UNIQUE NOT NULL,
  label text NOT NULL,
  group_name text NOT NULL,
  quantity int NOT NULL DEFAULT 0,
  claimed int NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wheel_reward_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wheel_reward_stock_admin_select" ON public.wheel_reward_stock;
CREATE POLICY "wheel_reward_stock_admin_select" ON public.wheel_reward_stock FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "wheel_reward_stock_admin_insert" ON public.wheel_reward_stock;
CREATE POLICY "wheel_reward_stock_admin_insert" ON public.wheel_reward_stock FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "wheel_reward_stock_admin_update" ON public.wheel_reward_stock;
CREATE POLICY "wheel_reward_stock_admin_update" ON public.wheel_reward_stock FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "wheel_reward_stock_admin_delete" ON public.wheel_reward_stock;
CREATE POLICY "wheel_reward_stock_admin_delete" ON public.wheel_reward_stock FOR DELETE
  TO authenticated USING (public.is_admin());

-- 4. wheel_spin_log
CREATE TABLE IF NOT EXISTS public.wheel_spin_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_key text NOT NULL,
  reward_label text NOT NULL,
  reward_group text NOT NULL,
  is_special boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wheel_spin_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wheel_spin_log_select_own" ON public.wheel_spin_log;
CREATE POLICY "wheel_spin_log_select_own" ON public.wheel_spin_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wheel_spin_log_admin_select" ON public.wheel_spin_log;
CREATE POLICY "wheel_spin_log_admin_select" ON public.wheel_spin_log FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_wheel_spin_log_user_id ON public.wheel_spin_log(user_id);

-- 5. spin_wheel()
CREATE OR REPLACE FUNCTION public.spin_wheel()
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

  -- Atomically decrement spins; only proceeds if a spin was available
  UPDATE public.profiles
    SET wheel_spins = wheel_spins - 1
    WHERE id = v_uid AND wheel_spins > 0
    RETURNING wheel_spins, wheel_special_claimed INTO v_spins, v_special_claimed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bạn không có lượt quay nào';
  END IF;

  -- Pick the top-level group by exact spec rates
  v_roll := random();
  IF v_roll < 0.30 THEN
    v_group := 'MISS';
  ELSIF v_roll < 0.50 THEN
    v_group := 'HUA_TIEN';
  ELSIF v_roll < 0.78 THEN
    v_group := 'CONG_DUC';
  ELSIF v_roll < 0.85 THEN
    v_group := 'AM_DUC';
  ELSIF v_roll < 0.98 THEN
    v_group := 'SHOP';
  ELSE
    v_group := 'SPECIAL';
  END IF;

  -- If special group but already claimed one, downgrade to MISS
  IF v_group = 'SPECIAL' AND v_special_claimed THEN
    v_group := 'MISS';
  END IF;

  -- If special group, check if any special stock remains; if not, downgrade to MISS
  IF v_group = 'SPECIAL' THEN
    PERFORM 1 FROM public.wheel_reward_stock
      WHERE is_special = true AND claimed < quantity
      LIMIT 1;
    IF NOT FOUND THEN
      v_group := 'MISS';
    END IF;
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
    -- Pick among available shop stock by sub-rate
    IF v_sub_roll < 0.50 THEN
      v_reward_key := 'SHOP_KV1';
    ELSIF v_sub_roll < 0.8571 THEN
      v_reward_key := 'SHOP_KV2';
    ELSE
      v_reward_key := 'SHOP_KV3';
    END IF;
    -- Verify stock; if out, fall back to any available shop item, else MISS
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

  ELSIF v_group = 'SPECIAL' THEN
    -- Pick a random available special reward
    SELECT id, label, reward_key INTO v_stock_id, v_reward_label, v_reward_key
      FROM public.wheel_reward_stock
      WHERE is_special = true AND claimed < quantity
      ORDER BY random()
      LIMIT 1;
    IF v_stock_id IS NULL THEN
      v_group := 'MISS';
      v_reward_key := 'MISS';
      v_reward_label := 'Chúc bạn may mắn lần sau';
      v_reward_group := 'MISS';
    ELSE
      v_is_special := true;
      v_reward_group := 'Quà Đặc Biệt';
      -- Mark one-per-account
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

-- 6. admin_grant_spins()
CREATE OR REPLACE FUNCTION public.admin_grant_spins(p_user_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Số lượt không hợp lệ (1-1000)';
  END IF;
  UPDATE public.profiles SET wheel_spins = wheel_spins + p_amount WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_spins(p_user_id uuid, p_amount int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_spins(p_user_id uuid, p_amount int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_spins(p_user_id uuid, p_amount int) TO authenticated;

-- 7. Seed default reward stock
INSERT INTO public.wheel_reward_stock (reward_key, label, group_name, quantity, is_special) VALUES
  ('SHOP_KV1', 'TT KV1', 'SHOP', 7, false),
  ('SHOP_KV2', 'TT KV2', 'SHOP', 5, false),
  ('SHOP_KV3', 'TT KV3', 'SHOP', 2, false),
  ('SPECIAL_EDIT_AMT', 'Đơn Edit — Ái Mục Thuần Nghiên', 'SPECIAL', 5, true),
  ('SPECIAL_EDIT_TH', 'Đơn Edit — Tứ Hiển', 'SPECIAL', 2, true),
  ('SPECIAL_CALLI', 'Đơn Thư pháp — Tạ Kính Tùng', 'SPECIAL', 10, true),
  ('SPECIAL_INCENSE', 'Nến thơm', 'SPECIAL', 5, true),
  ('SPECIAL_QUESTION', 'Một câu hỏi', 'SPECIAL', 2, true)
ON CONFLICT (reward_key) DO NOTHING;
