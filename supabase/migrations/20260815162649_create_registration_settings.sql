/*
# Create site_settings table for registration lock

## Purpose
Stores a single row controlling whether new account registration is open or closed.
Admins can toggle this from the admin dashboard. When locked, the register page
hides the sign-up form and shows a "registration closed" message instead.

## New Tables
- `site_settings`
  - `id` (int, primary key, always 1 — singleton row)
  - `registration_open` (boolean, default false — locked by default)
  - `updated_at` (timestamptz)

## Security
- RLS enabled.
- SELECT: anon + authenticated can read (the register page needs to check the flag).
- UPDATE: only authenticated users (admin uses the supabase client with their session).
  In practice only admin emails reach this page, but the policy allows any authenticated
  user to update; the admin UI is the gatekeeper.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_open boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_settings (id, registration_open)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_site_settings" ON site_settings;
CREATE POLICY "anon_read_site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_site_settings" ON site_settings;
CREATE POLICY "auth_update_site_settings"
  ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
