/*
# Admin Currency Adjustment — atomic function

1. Purpose
- The admin dashboard currently does two separate client-side calls to adjust a
  player's currency: UPDATE profiles then INSERT transactions. If either fails,
  the database is left inconsistent (balance changed without log, or log without
  balance change).
- This creates a single `admin_adjust_currency` SECURITY DEFINER function that
  does both atomically in one server-side transaction, mirroring the existing
  `self_adjust_currency` pattern but callable by admins on any player.

2. Security
- SECURITY DEFINER so it can write to transactions and update any profile's
  currency columns (which client-side RLS only allows for the owner or admin).
- Only callable by authenticated admins — the function body checks is_admin().
- search_path set to public to prevent schema injection.
- REVOKE from anon/PUBLIC; GRANT only to authenticated.

3. Notes
- Safe to re-run: CREATE OR REPLACE.
- Does NOT use BEGIN/COMMIT — the function body is implicitly a transaction.
- The reason is prefixed with "[QTV] " so player-side history clearly shows it
  was an admin action, distinguishing it from self-adjustments.
*/

CREATE OR REPLACE FUNCTION public.admin_adjust_currency(
  p_user_id uuid,
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
  v_admin_id uuid := auth.uid();
  v_new_balance int;
  v_current int;
  v_final_reason text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện giao dịch.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền điều chỉnh tài sản người chơi.';
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
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi.';
  END IF;

  v_new_balance := v_current + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Số dư không thể âm. Hiện tại: %, điều chỉnh: %', v_current, p_amount;
  END IF;

  IF p_currency_type = 'HUA_TIEN' THEN
    UPDATE public.profiles SET hua_tien = v_new_balance WHERE id = p_user_id;
  ELSIF p_currency_type = 'CONG_DUC' THEN
    UPDATE public.profiles SET cong_duc = v_new_balance WHERE id = p_user_id;
  ELSIF p_currency_type = 'AM_DUC' THEN
    UPDATE public.profiles SET am_duc = v_new_balance WHERE id = p_user_id;
  END IF;

  v_final_reason := '[QTV] ' || btrim(p_reason);

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
  VALUES (p_user_id, p_amount, p_currency_type, v_final_reason);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'currency_type', p_currency_type
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_currency(uuid, int, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_currency(uuid, int, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_currency(uuid, int, text, text) TO authenticated;
