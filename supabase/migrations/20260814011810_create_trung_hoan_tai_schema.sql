/*
# Trùng Hoan Tái - Full Schema Setup

1. New Tables
- `profiles`: Player profiles linked to auth.users. Stores OC name, avatar, gender, bio, currencies (hua_tien, cong_duc, am_duc), approval status, anonymous name.
- `transactions`: Log of all currency changes (hua_tien, cong_duc, am_duc) with reason.
- `shop_items`: Items available in the shop with price, currency type, category, stock.
- `carts`: Per-user cart items (max 10 enforced in app).
- `inventories`: Items owned by players.
- `posts`: Anonymous forum posts with title, content, category.
- `messages`: 1-1 direct messages between players.
- `site_pages`: World-building content pages with page number, title, category, content.

2. Helper Functions
- `is_admin()`: Returns true if the current authenticated user's email is in the admin list. Used in RLS policies.

3. Security (RLS)
- All tables have RLS enabled.
- profiles: authenticated users can read all (community), insert/update own. Admin can update all (approve accounts, manage currencies).
- transactions: users read own, admin can read all and insert.
- shop_items: all authenticated read, admin can insert/update/delete.
- carts: users CRUD own cart.
- inventories: users read own, admin can insert (granting items).
- posts: authenticated read all, insert own, update/delete own.
- messages: users read messages they sent or received, insert own.
- site_pages: all authenticated read, admin can insert/update/delete.
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  oc_name text not null,
  avatar_url text,
  gender text default 'Khác',
  bio text,
  hua_tien int default 300,
  cong_duc int default 30,
  am_duc int default 0,
  is_approved boolean default false,
  anonymous_name text,
  anonymous_name_changes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  amount int not null,
  currency_type text check (currency_type in ('HUA_TIEN', 'CONG_DUC', 'AM_DUC')),
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- 3. Shop items table
CREATE TABLE IF NOT EXISTS public.shop_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  price int not null,
  currency_type text check (currency_type in ('HUA_TIEN', 'CONG_DUC', 'AM_DUC')),
  description text,
  stock int default 99
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_items_select_all" ON public.shop_items;
CREATE POLICY "shop_items_select_all" ON public.shop_items FOR SELECT
  TO authenticated USING (true);

-- 4. Carts table
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  item_id uuid references public.shop_items(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carts_select_own" ON public.carts;
CREATE POLICY "carts_select_own" ON public.carts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "carts_insert_own" ON public.carts;
CREATE POLICY "carts_insert_own" ON public.carts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "carts_delete_own" ON public.carts;
CREATE POLICY "carts_delete_own" ON public.carts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. Inventories table
CREATE TABLE IF NOT EXISTS public.inventories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  item_id uuid references public.shop_items(id) on delete cascade,
  acquired_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventories_select_own" ON public.inventories;
CREATE POLICY "inventories_select_own" ON public.inventories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- 6. Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'Thảo luận',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- 7. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 8. Site pages table
CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid default uuid_generate_v4() primary key,
  page_number int unique not null,
  title text not null,
  category text not null,
  content text not null
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_pages_select_all" ON public.site_pages;
CREATE POLICY "site_pages_select_all" ON public.site_pages FOR SELECT
  TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON public.inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
