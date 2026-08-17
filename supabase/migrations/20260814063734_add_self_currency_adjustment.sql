/*
# Player Self-Currency Adjustment

1. New Functions
- `self_adjust_currency(p_amount int, p_currency_type text, p_reason text)`:
  SECURITY DEFINER function that lets an authenticated player adjust their own
  currency balance (Hoa Tiền, Công Đức, or Âm Đức). It atomically:
    a. Updates the player's profile balance (adds p_amount, which may be negative).
    b. Inserts a transaction record with the amount, currency type, reason, and
       automatic timestamp.
    c. Returns the new balance for that currency.
  The function enforces that the balance cannot go negative.

2. Security
- SECURITY DEFINER so it can insert into the transactions table (which players
  cannot insert into directly via RLS — only admins can).
- Uses auth.uid() to identify the player — no user_id parameter, so a player
  can only adjust their own balance.
- search_path set to public to prevent schema injection.

3. Notes
- Players still cannot directly INSERT into transactions via the client — only
  this function can, which ensures every balance change is paired with a log
  entry atomically.
- The function is callable by any authenticated user (EXECUTE granted to authenticated).
*/

CREATE OR REPLACE FUNCTION public.self_adjust_currency(
  p_amount int,
  p_currency_type text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_balance int;
  v_current int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện giao dịch.';
  END IF;

  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RAISE EXCEPTION 'Loại tiền không hợp lệ.';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Số tiền phải khác 0.';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Lý do không được để trống.';
  END IF;

  SELECT
    CASE p_currency_type
      WHEN 'HUA_TIEN' THEN hua_tien
      WHEN 'CONG_DUC' THEN cong_duc
      WHEN 'AM_DUC' THEN am_duc
    END
  INTO v_current
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi.';
  END IF;

  v_new_balance := v_current + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Số dư không thể âm. Hiện tại: %, điều chỉnh: %', v_current, p_amount;
  END IF;

  IF p_currency_type = 'HUA_TIEN' THEN
    UPDATE public.profiles SET hua_tien = v_new_balance WHERE id = v_user_id;
  ELSIF p_currency_type = 'CONG_DUC' THEN
    UPDATE public.profiles SET cong_duc = v_new_balance WHERE id = v_user_id;
  ELSIF p_currency_type = 'AM_DUC' THEN
    UPDATE public.profiles SET am_duc = v_new_balance WHERE id = v_user_id;
  END IF;

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
  VALUES (v_user_id, p_amount, p_currency_type, p_reason);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'currency_type', p_currency_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.self_adjust_currency(int, text, text) TO authenticated;
