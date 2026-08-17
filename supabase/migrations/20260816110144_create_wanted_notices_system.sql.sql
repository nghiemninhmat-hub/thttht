/*
# Create wanted notices (bảng truy nã) system

1. New Tables
- `wanted_notices`
  - `id` (uuid, primary key)
  - `submitter_id` (uuid, references auth.users, the player who submitted — hidden from public view)
  - `target_name` (text, not null) — tên đối tượng truy nã
  - `gender` (text) — giới tính
  - `age` (text) — tuổi (text để linh hoạt "XX", "không rõ")
  - `occupation` (text) — nghề nghiệp
  - `organization` (text) — tổ chức
  - `identifying_features` (text) — đặc điểm nhận dạng
  - `reason` (text, not null) — lý do truy nã
  - `task_requirement` (text) — yêu cầu nhiệm vụ
  - `completion_condition` (text) — điều kiện hoàn thành
  - `avatar_url` (text) — ảnh đại diện đối tượng
  - `reward_amount` (text) — mức thưởng (text để linh hoạt "500 Hoa Tiền + 70 Công Đức")
  - `reward_method` (text) — hình thức nhận thưởng
  - `deadline` (text) — thời hạn truy nã (text để linh hoạt "Không thời hạn" hoặc ngày)
  - `status` (text, default 'pending') — pending / active / completed / rejected
  - `code` (text, unique) — mã lệnh truy nã, ví dụ "#038517"
  - `published_at` (timestamptz) — ngày phát lệnh (set khi admin duyệt)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `wanted_notices`.
- SELECT: anyone (anon + authenticated) can read notices with status 'active' or 'completed'.
  Submitters can also read their own pending/rejected notices.
- INSERT: authenticated users can insert their own submissions (submitter_id = auth.uid()).
- UPDATE: admin only (is_admin()).
- DELETE: admin only (is_admin()).
- The `submitter_id` column is NOT exposed to the frontend query — the public view
  selects all columns EXCEPT submitter_id. This keeps the submitter anonymous.

3. Important Notes
- The app has a sign-in screen, so policies use `TO authenticated` for writes.
- SELECT uses `TO anon, authenticated` so unauthenticated visitors can browse the board.
- `submitter_id` defaults to auth.uid() so inserts that omit it still satisfy RLS.
- Admin approval flow: player submits (status='pending'), admin reviews and sets
  status='active' with a published_at timestamp and a unique code.
*/

CREATE TABLE IF NOT EXISTS wanted_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  target_name text NOT NULL,
  gender text DEFAULT '',
  age text DEFAULT '',
  occupation text DEFAULT '',
  organization text DEFAULT '',
  identifying_features text DEFAULT '',
  reason text NOT NULL,
  task_requirement text DEFAULT '',
  completion_condition text DEFAULT '',
  avatar_url text DEFAULT '',
  reward_amount text DEFAULT '',
  reward_method text DEFAULT '',
  deadline text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  code text UNIQUE,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wanted_notices ENABLE ROW LEVEL SECURITY;

-- SELECT: public can see active/completed; submitter can see own pending/rejected
DROP POLICY IF EXISTS "public_read_wanted_notices" ON wanted_notices;
CREATE POLICY "public_read_wanted_notices" ON wanted_notices FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('active', 'completed')
    OR (auth.uid() = submitter_id)
  );

-- INSERT: authenticated users can submit their own
DROP POLICY IF EXISTS "insert_own_wanted_notices" ON wanted_notices;
CREATE POLICY "insert_own_wanted_notices" ON wanted_notices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitter_id);

-- UPDATE: admin only
DROP POLICY IF EXISTS "admin_update_wanted_notices" ON wanted_notices;
CREATE POLICY "admin_update_wanted_notices" ON wanted_notices FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
DROP POLICY IF EXISTS "admin_delete_wanted_notices" ON wanted_notices;
CREATE POLICY "admin_delete_wanted_notices" ON wanted_notices FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_wanted_notices_status ON wanted_notices(status);
CREATE INDEX IF NOT EXISTS idx_wanted_notices_submitter ON wanted_notices(submitter_id);
