/*
# Create Kim Bảng Đề Danh (Leaderboard) system

1. New Tables
- `kim_bang`
  - `id` (uuid, primary key)
  - `rank` (int, 1-6, unique) — vị trí xếp hạng (1 = Đệ Nhất, 6 = Đệ Lục)
  - `identity_name` (text, not null) — danh tính nhân vật
  - `wealth` (text) — tài phú (text để linh hoạt "8.460 Hoa Tiền")
  - `quests_completed` (int) — số dị sự hoàn thành
  - `honor_title` (text) — danh hiệu tri ân
  - `avatar_url` (text) — ảnh đại diện
  - `epithet` (text) — câu vĩ ngữ ngắn gọn (vd: "Một kiếm trấn tà, danh vang đất Trùng Hoan.")
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `kim_bang`.
- SELECT: anyone (anon + authenticated) can read — bảng công khai.
- INSERT/UPDATE/DELETE: admin only (is_admin()).

3. Important Notes
- Kim Bảng chỉ có 6 vị trí cố định (rank 1-6).
- Quản trị viên cập nhật thủ công, người chơi không thể tự chỉnh sửa.
- avatar_url dùng link ảnh, hệ thống tự hiển thị.
*/

CREATE TABLE IF NOT EXISTS kim_bang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank int NOT NULL UNIQUE CHECK (rank >= 1 AND rank <= 6),
  identity_name text NOT NULL DEFAULT '',
  wealth text DEFAULT '',
  quests_completed int DEFAULT 0,
  honor_title text DEFAULT '',
  avatar_url text DEFAULT '',
  epithet text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kim_bang ENABLE ROW LEVEL SECURITY;

-- SELECT: public can read
DROP POLICY IF EXISTS "public_read_kim_bang" ON kim_bang;
CREATE POLICY "public_read_kim_bang" ON kim_bang FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: admin only
DROP POLICY IF EXISTS "admin_insert_kim_bang" ON kim_bang;
CREATE POLICY "admin_insert_kim_bang" ON kim_bang FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- UPDATE: admin only
DROP POLICY IF EXISTS "admin_update_kim_bang" ON kim_bang;
CREATE POLICY "admin_update_kim_bang" ON kim_bang FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELETE: admin only
DROP POLICY IF EXISTS "admin_delete_kim_bang" ON kim_bang;
CREATE POLICY "admin_delete_kim_bang" ON kim_bang FOR DELETE
  TO authenticated USING (public.is_admin());

-- Seed 6 empty rows
INSERT INTO kim_bang (rank, identity_name, wealth, quests_completed, honor_title, avatar_url, epithet)
VALUES
  (1, '', '', 0, '', '', ''),
  (2, '', '', 0, '', '', ''),
  (3, '', '', 0, '', '', ''),
  (4, '', '', 0, '', '', ''),
  (5, '', '', 0, '', '', ''),
  (6, '', '', 0, '', '', '')
ON CONFLICT (rank) DO NOTHING;
