/*
# Create bach_quy_am table — Bách Quỷ Âm bestiary

1. Purpose
- Consolidate the 4 existing "Bách Quỷ Âm" site_pages entries (pages 8, 12, 13, 14)
  into a dedicated table for the new Bách Quỷ Âm page.
- Each row represents one ghost type with structured fields.
- Features a lock/unlock system: only admins can unlock entries; players see
  only basic info (name, classification, danger level, brief description) for
  locked entries, and full details for unlocked entries.

2. New Table: bach_quy_am
- id (uuid, primary key)
- name (text, not null) — ghost name (e.g. "Treo Cổ Quỷ")
- classification (text, not null) — source/origin category
- danger_level (text, not null) — danger progression (e.g. "Du Hồn → Lệ Quỷ")
- event_level (text) — event difficulty tier (e.g. "Thi → Ngân")
- brief_description (text, not null) — short description always visible
- weakness (text) — locked field
- appearance (text) — locked field
- behavior (text) — locked field
- destruction (text) — locked field
- sealing (text) — locked field
- display_order (int, default 0) — sort order
- is_unlocked (boolean, default false) — whether full info is visible to players
- unlocked_at (timestamptz) — when admin unlocked it
- created_at (timestamptz, default now())

3. Security
- RLS enabled.
- SELECT: anon + authenticated can read (public bestiary content).
- INSERT/UPDATE/DELETE: admin only (is_admin() check).
- The is_unlocked column is readable by all — the frontend uses it to decide
  which fields to show. Server-side enforcement of the lock is NOT needed here
  because the locked fields are still "flavor text" lore, not sensitive data.
  The lock is a gameplay/progression mechanic, not a security boundary.

4. Data
- Seeds all 15 ghost entries from the existing site_pages content.
*/

CREATE TABLE IF NOT EXISTS public.bach_quy_am (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  classification text NOT NULL,
  danger_level text NOT NULL,
  event_level text,
  brief_description text NOT NULL,
  weakness text,
  appearance text,
  behavior text,
  destruction text,
  sealing text,
  display_order int NOT NULL DEFAULT 0,
  is_unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bach_quy_am ENABLE ROW LEVEL SECURITY;

-- SELECT: everyone can read the bestiary
DROP POLICY IF EXISTS "bach_quy_am_select_all" ON public.bach_quy_am;
CREATE POLICY "bach_quy_am_select_all"
ON public.bach_quy_am FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: admin only
DROP POLICY IF EXISTS "bach_quy_am_admin_insert" ON public.bach_quy_am;
CREATE POLICY "bach_quy_am_admin_insert"
ON public.bach_quy_am FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: admin only
DROP POLICY IF EXISTS "bach_quy_am_admin_update" ON public.bach_quy_am;
CREATE POLICY "bach_quy_am_admin_update"
ON public.bach_quy_am FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: admin only
DROP POLICY IF EXISTS "bach_quy_am_admin_delete" ON public.bach_quy_am;
CREATE POLICY "bach_quy_am_admin_delete"
ON public.bach_quy_am FOR DELETE
TO authenticated
USING (public.is_admin());

-- Seed all 15 ghost entries
INSERT INTO public.bach_quy_am (name, classification, danger_level, event_level, brief_description, weakness, appearance, behavior, destruction, sealing, display_order) VALUES
('Treo Cổ Quỷ', 'Linh hồn người chết do thắt cổ tự tử hoặc bị hành hình bằng giá treo cổ', 'Du Hồn → Lệ Quỷ', 'Thi → Ngân', 'Cổ kéo dài, lưỡi thè ra ngoài, luôn tìm kiếm người thay thế.', 'Sợ ánh sáng mặt trời trực tiếp; sợi dây thừng định mệnh chính là "vật ký sinh" cốt lõi.', 'Xà nhà cũ, cây cổ thụ, khung giờ âm khí thịnh (23h-1h sáng).', 'Thả dây thòng lọng, thì thầm/tạo ảo giác ép nạn nhân tự thắt cổ.', 'Đốt cháy hoàn toàn sợi dây thừng gốc.', 'Đóng đinh quan tài xuyên qua sợi dây thừng gốc, bọc vải điều ngâm máu chó mực.', 1),
('Thủy Quỷ', 'Linh hồn người chết đuối không thể siêu thoát', 'Oán Hồn → Hung Sát', 'Ngân', 'Thân hình trơn nhớt, tóc dài như rong rêu, mắt trắng dã, sức mạnh cực lớn dưới nước.', 'Mất sạch sức mạnh khi bị kéo lên cạn hoặc tiếp xúc với lửa/đất khô.', 'Sông sâu, đầm lầy, giếng hoang vào ngày mưa bão/âm u.', 'Giả tiếng kêu cứu, kéo chân người tắm sông để "thế mạng".', 'Dùng thuốc nổ chấn động âm khí dưới nước hoặc dụ lên bờ hỏa thiêu.', 'Cắm cọc gỗ đào khắc bùa xung quanh hoặc thả chuông đồng phong ấn xuống đáy nước.', 2),
('Tân Nương Quỷ', 'Phụ nữ chết oan trong ngày cưới hoặc chết do hủ tục "minh hôn"', 'Oán Hồn → Quỷ Tướng', 'Hoàng → Phỉ', 'Mặc áo cưới đỏ rực, khăn trùm đầu đỏ, móng tay đỏ thẫm, tỏa mùi phấn son lẫn mùi xác thối.', 'Vật phẩm ngày cưới chính thức (chữ "Song Hỷ" chính đạo) hoặc gương lược lúc sinh thời.', 'Nhà cổ, hôn lễ ban đêm, con đường kiệu hoa từng đi qua.', 'Tạo ảo giác "Đám cưới ma", bắt nam giới hút cạn dương khí đêm động phòng.', 'Dùng máu gà trống thiến rưới lên áo cưới và đốt cùng hài cốt.', 'Dùng chỉ ngũ sắc kết hợp bùa chú giăng kín quan tài, khóa bằng khóa đồng âm dương.', 3),
('Huyết Quỷ', 'Tích tụ từ lượng máu khổng lồ của sự oán hận (pháp trường, thảm sát, chiến trường)', 'Lệ Quỷ → Quỷ Vương', 'Phỉ', 'Khối chất lỏng màu đỏ ngòm, tanh tưởi, tính ăn mòn cực cao.', 'Muối hạt thô và bột chu sa nồng độ cao (gây đông cứng và phân rã).', 'Khi có sự hiến tế bằng máu hoặc ngửi thấy mùi máu tươi.', 'Tràn vào vết thương hở, biến nạn nhân thành "cột máu di động" hoặc hút cạn máu.', 'Trận pháp Hỏa thiêu quy mô lớn (dầu hỏa trộn chu sa) đốt thành tro khô.', 'Chứa toàn bộ nguồn máu vào chum sành nung từ đền linh, bọc lá bùa phong ấn vàng.', 4),
('Mộng Quỷ', 'Thực thể tinh thần tồn tại dựa trên nỗi sợ hãi và tổn thương tâm lý', 'Oán Hồn → Hung Sát', 'Hoàng', 'Không có hình hài vật lý cố định.', 'Khi nạn nhân nhận thức được mình đang mơ (lucid dream) và chế ngự nỗi sợ, sức mạnh Mộng Quỷ bằng 0.', 'Mục tiêu ngủ sâu, suy nhược tinh thần hoặc giữ đồ vật bị nguyền rủa.', 'Thao túng giấc mơ thành ác mộng. Nạn nhân chết trong mơ sẽ đột tử ngoài đời thực.', 'Điều tra viên dùng thuật "Dẫn Hồn" vào giấc mơ, dùng tâm kiếm trảm đứt sợi tơ kết nối.', 'Đặt gương bát quái ngược dưới gối, đốt trầm hương định hồn quanh giường.', 5),
('Quỷ Mẫu', 'Phụ nữ chết khi mang thai hoặc chết cùng con nhỏ do bị bạo hành, ruồng bỏ', 'Hung Sát → Quỷ Tướng', 'Hoàng', 'Bụng bầu lớn, gương mặt vặn vẹo oán hận, ôm bọc vải đỏ hoặc dắt bóng ma trẻ con.', 'Tiếng khóc của đứa con ruột hoặc kỷ vật thể hiện tình mẫu tử chính đạo.', 'Khoa sản bỏ hoang, cô nhi viện cũ, gia đình có bạo hành phụ nữ thai sản.', 'Bắt cóc trẻ em người sống hoặc tấn công điên cuồng ai làm hại trẻ con.', 'Tìm phần mộ hai mẹ con, dùng nước bưởi tẩy trần và làm lễ hợp táng. Nếu quá nặng dùng lôi hỏa trận.', 'Quấn chỉ đỏ tết từ tóc người mẹ lúc sống quanh tượng Phật Bà Quan Âm.', 6),
('Tiểu Quỷ', 'Hài nhi bị nạo phá thai, chết yểu hoặc bị tà sư luyện thành bùa ngải', 'Du Hồn → Lệ Quỷ', 'Thi → Ngân', 'Hình dáng nhỏ bé, nhanh nhẹn, tiếng cười ré lanh lảnh, mặt quỷ dị.', 'Sợ đồ chơi trẻ em được gia trì kinh Phật, sợ máu của người mẹ ruột sám hối.', 'Góc tối, gầm giường, hoặc quanh người nuôi ngải giờ ăn cúng.', 'Giấu đồ, quấy nhiễu đêm. Nếu là quỷ sai sẽ hút sinh khí hoặc gây tai nạn.', 'Đập tan hũ cốt/tượng, dùng bột chu sa và hỏa thiêu.', 'Giam trong hộp gỗ đào khắc bùa bình an, đặt bệ thờ tụng kinh sám hối.', 7),
('Tử Lao Quỷ', 'Phạm nhân chết oan hoặc bị tra tấn dã man trong nhà tù, hầm ngục', 'Oán Hồn → Lệ Quỷ', 'Ngân', 'Đầy vết thương, xiềng xích quấn quanh người phát ra tiếng loảng xoảng.', 'Tiếng khánh đồng/trống quan đường chính trực và ánh sáng mặt trời mạnh.', 'Nhà tù cũ, hầm tối sâu lòng đất, nơi có năng lượng giam giữ đậm đặc.', 'Gieo rắc tuyệt vọng, điên loạn, khiến nạn nhân tự tàn tật hoặc rơi vào ảo giác bị tra tấn.', 'Dùng kiếm rèn từ sắt lò đại hỏa cắt đứt xiềng xích oán khí.', 'Dùng đá khắc "Chữ Chính" hoặc bùa Trấn Trạch chặn lối ra vào hầm ngục.', 8),
('Binh Hồn', 'Binh lính tử trận trên chiến trường', 'Lệ Quỷ → Hung Sát', 'Hoàng', 'Xuất hiện theo quân đoàn (Âm Binh Mượn Đường), giáp rách, binh khí gãy, mặt xám xịt.', 'Sợ tiếng gà gáy rạng đông; sợ lệnh bài của các vị tướng quân chính thống.', 'Thung lũng cô quạnh, chiến trường cổ vào đêm sương mù hoặc ngày mùng 1, rằm.', 'Di chuyển theo đội hình, chém giết sinh vật cản đường bằng âm binh khí.', 'Tiêu diệt Tướng Chỉ Huy bằng lệnh bài sát quỷ hoặc trận pháp ngũ hành, quân lính tự tan rã.', 'Cắm cờ lệnh bát quái 4 góc, dùng đất phong thổ dẫn dụ vào khu hoang phế cố định.', 9),
('Hí Quỷ', 'Đào kép xướng ca có số phận bi thảm, chết trên sân khấu hoặc bị bức tử', 'Oán Hồn → Hung Sát', 'Ngân → Hoàng', 'Mặt nạ hóa trang đậm, xiêm y lộng lẫy thấm đẫm máu.', 'Tiếng vỗ tay khen ngợi thật tâm hoặc việc hát sai lời kịch bản khiến vở diễn gián đoạn.', 'Rạp hát bỏ hoang, sân khấu cũ, hoặc khi bật lại khúc nhạc kịch cổ ban đêm.', 'Bắt người sống đóng vai trong vở kịch, diễn sai sẽ gánh kết cục bi thảm của nhân vật.', 'Đốt cháy màn nhung sân khấu chính hoặc bộ xiêm y cốt lõi lúc chết.', 'Úp ngược mặt nạ gỗ đào trơn lên mặt Hí Quỷ, đóng đinh đồng cố định vào hộp gỗ.', 10),
('Thi Quỷ', 'Oán khí nhập vào xác chết chưa phân hủy', 'Lệ Quỷ → Quỷ Tướng (Hàn Bạt)', 'Ngân → Hoàng', 'Cơ thể cứng đờ, móng tay đen búa, răng nanh sắc, hơi thở sặc mùi tử khí độc.', 'Gạo nếp thuần chủng, máu chó mực, mực tàu trộn chu sa, gương bát quái.', 'Nghĩa địa mộ kết âm, đất khắc nghiệt, mèo đen nhảy qua xác chết.', 'Di chuyển bằng cách nhảy/loạng choạng, dò tìm bằng hơi thở, cắn xé truyền thi độc.', 'Đâm cọc gỗ đào xuyên tim, dùng dầu hỏa hỏa thiêu thành tro.', 'Dán lá bùa sắc lệnh màu vàng (Bùa Cương Thi) trực tiếp lên trán.', 11),
('Trạch Quỷ', 'Thực thể gắn liền với mảnh đất hoặc cấu trúc ngôi nhà cụ thể', 'Du Hồn → Oán Hồn', 'Thi', 'Chủ cũ chết không rời đi hoặc vong linh vất vưởng biến nhà thành lãnh địa.', 'Đập phá xà gồ/cột trụ chính hoặc dùng bùa cải tạo phong thủy mạnh.', 'Nhà hoang lâu năm, biệt thự cổ, chủ mới dọn vào không làm lễ thổ thần.', 'Gây tiếng bước chân, đồ vật dịch chuyển, bóng đè nhằm xua đuổi người sống.', 'Xông nước lá bưởi + bồ kết, trì chú trục xuất vong linh.', 'Chôn trận đồ Ngũ Đế Tiền dưới 4 góc nhà và trung tâm phòng khách.', 12),
('Vô Diện Quỷ', 'Người chết bị hủy hoại hoàn toàn khuôn mặt (tạt axit, cháy, thú cắn)', 'Lệ Quỷ → Hung Sát', 'Hoàng', 'Phần mặt phẳng lì, trắng bệch, không có ngũ quan.', 'Gọi đúng tên khai sinh thật lúc sinh thời sẽ khiến nó đông cứng vì nhớ lại bản ngã.', 'Hẻm tối, gương nhà vệ sinh công cộng ban đêm, nơi tai nạn biến dạng.', 'Giả dạng người quen từ phía sau, khi nạn nhân nhìn thẳng sẽ cướp mặt và sinh khí.', 'Dùng dao bạc nguyên chất khắc bùa đâm thẳng ấn đường.', 'Dùng vải thưa thấm mực chu sa che kín đầu, khóa bằng xích sắt âm dương.', 13),
('Sơn Quỷ', 'Chướng khí rừng sâu kết hợp oán khí phu trầm, thợ săn bỏ mạng', 'Hung Sát → Quỷ Vương', 'Phỉ', 'To lớn như cây cổ thụ, da như vỏ cây, mắt sáng như đom đóm đại ngàn.', 'Sợ lửa lớn và rìu thép tôi luyện bằng nước suối đền thánh mẫu.', 'Rừng già sâu thẳm, hang động đá vôi hẻo lánh ngày sương mù.', 'Thao túng cây cối đá lở, giả tiếng người quen dụ nạn nhân vào vực thẳm.', 'Tìm "cây sinh mệnh" tích tụ oán khí, đổ dầu thông châm lửa thiêu rụi.', 'Dùng xích đồng đen quấn thân cây gốc, đóng 8 cọc gỗ đào thế trận Bát Quái.', 14),
('Ngạ Quỷ', 'Người sinh thời tham lam ích kỷ hoặc chết đói không ai cúng giếng', 'Du Hồn → Lệ Quỷ', 'Thi', 'Bụng to như trống, cổ họng nhỏ như kim, lửa cháy nơi khóe miệng không nuốt được thức ăn.', 'Thức ăn được gia trì bằng Chú Biến Thực (thành cam lộ không hóa lửa).', 'Bãi rác, góc chợ bỏ hoang, lễ cúng cô hồn tháng 7 Âm lịch.', 'Bu bám vai cổ người sống hút mùi vị thức ăn, khiến nạn nhân gầy gò ốm yếu.', 'Ưu tiên dùng Chú Biến Thực độ hóa. Nếu tiêu diệt dùng Tam muội chân hỏa.', 'Nhốt vào bình cam lộ có rắc gạo muối, đặt dưới bệ thờ Địa Tạng Vương Bồ Tát.', 15)
ON CONFLICT DO NOTHING;
