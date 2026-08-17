/*
# Add player-to-player Hoa Tiền transfer system

1. Purpose
- Allows players to transfer Hoa Tiền to another player by entering the recipient's OC name.
- The transfer is atomic, logged in both sender's and receiver's transaction history, and visible to admins.
- Only Hoa Tiền can be transferred (not Công Đức or Âm Đức).
- A reason/memo is required. Timestamp is automatic.

2. Schema changes
- Adds `related_user_name` column (text, nullable) to `transactions` to record the counterparty's OC name in transfer transactions.
- This column is nullable so existing rows are unaffected.

3. New RPC function: `transfer_hua_tien`
- Parameters: p_recipient_name (text), p_amount (int), p_reason (text)
- Validates: sender authenticated, amount > 0, sender has enough hua_tien, recipient exists and is approved, sender != recipient, reason not empty.
- Atomically: deducts from sender's hua_tien, adds to recipient's hua_tien, inserts two transaction rows (one negative for sender, one positive for receiver) with related_user_name set.
- SECURITY DEFINER, REVOKE from anon/PUBLIC, GRANT to authenticated.

4. Security
- Uses auth.uid() for sender identity — no forgeable user_id parameter.
- RLS on transactions already allows authenticated to insert own rows; this RPC is cleaner and atomic.
- No new RLS policies needed — the RPC does all writes server-side as SECURITY DEFINER.

5. Notes
- Safe to re-run: uses IF NOT EXISTS for column, DROP FUNCTION IF EXISTS for RPC.
- Does NOT use BEGIN/COMMIT — function body is implicitly transactional.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'related_user_name'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN related_user_name text;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.transfer_hua_tien(text, integer, text);

CREATE FUNCTION public.transfer_hua_tien(
  p_recipient_name text,
  p_amount integer,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_name text;
  v_recipient_id uuid;
  v_recipient_name text;
  v_sender_balance int;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Số tiền chuyển phải lớn hơn 0';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do chuyển khoản';
  END IF;

  -- Get sender info
  SELECT id, oc_name, hua_tien INTO v_sender_id, v_sender_name, v_sender_balance
    FROM public.profiles WHERE id = v_sender_id;

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người gửi';
  END IF;

  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Không đủ Hoa Tiền để chuyển (số dư: %)', v_sender_balance;
  END IF;

  -- Find recipient by OC name (case-sensitive match)
  SELECT id, oc_name INTO v_recipient_id, v_recipient_name
    FROM public.profiles
    WHERE oc_name = p_recipient_name AND is_approved = true;

  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người nhận "%"', p_recipient_name;
  END IF;

  IF v_recipient_id = v_sender_id THEN
    RAISE EXCEPTION 'Không thể chuyển cho chính mình';
  END IF;

  -- Deduct from sender
  UPDATE public.profiles
    SET hua_tien = hua_tien - p_amount
    WHERE id = v_sender_id;

  -- Add to recipient
  UPDATE public.profiles
    SET hua_tien = hua_tien + p_amount
    WHERE id = v_recipient_id;

  -- Log sender transaction (negative)
  INSERT INTO public.transactions (user_id, amount, currency_type, reason, related_user_name)
    VALUES (v_sender_id, -p_amount, 'HUA_TIEN', 'Chuyển khoản: ' || btrim(p_reason), v_recipient_name);

  -- Log recipient transaction (positive)
  INSERT INTO public.transactions (user_id, amount, currency_type, reason, related_user_name)
    VALUES (v_recipient_id, p_amount, 'HUA_TIEN', 'Nhận chuyển khoản: ' || btrim(p_reason), v_sender_name);

  RETURN jsonb_build_object(
    'success', true,
    'recipient_name', v_recipient_name,
    'amount', p_amount
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) TO authenticated;
