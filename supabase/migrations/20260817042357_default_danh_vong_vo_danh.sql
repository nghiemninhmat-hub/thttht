-- Default danh_vong to 'Vô Danh' for all players
ALTER TABLE public.profiles ALTER COLUMN danh_vong SET DEFAULT 'Vô Danh';
UPDATE public.profiles SET danh_vong = 'Vô Danh' WHERE danh_vong IS NULL OR danh_vong = '';
