/*
# Add Admin Audit Log and Approval Tracking

## Purpose
Track which admin approved each user registration, and log all admin actions
(currency adjustments, item edits, transaction edits, inventory grants/revokes,
wheel spin grants, wanted notice approvals, etc.) for accountability.

## Changes

### 1. profiles table — new columns
- `approved_by` (uuid, nullable): references auth.users(id). Set when an admin
  approves a registration. NULL for pending or self-registered accounts.
- `approved_at` (timestamptz, nullable): timestamp of approval.

### 2. New table: admin_audit_log
- `id` (uuid, primary key)
- `admin_id` (uuid, not null): the admin who performed the action
- `admin_email` (text): admin's email for readability
- `action` (text, not null): short action type, e.g. 'approve_user', 'adjust_currency'
- `target_user_id` (uuid, nullable): affected user if applicable
- `target_description` (text, nullable): human-readable description of what was done
- `details` (jsonb, nullable): structured details (amount, currency, item name, etc.)
- `created_at` (timestamptz, default now())

### 3. Security
- RLS enabled on admin_audit_log
- Only admins can SELECT (view audit trail)
- Only admins can INSERT (log actions) — enforced via is_admin()
- No UPDATE or DELETE — audit logs are immutable
*/

-- Add approval tracking columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email text,
  action text NOT NULL,
  target_user_id uuid,
  target_description text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
DROP POLICY IF EXISTS "admin_audit_log_admin_select" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_admin_select" ON public.admin_audit_log FOR SELECT
  TO authenticated USING (public.is_admin());

-- Admins can insert audit log entries
DROP POLICY IF EXISTS "admin_audit_log_admin_insert" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_admin_insert" ON public.admin_audit_log FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Create a helper function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_description text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_admin_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = v_admin_id;

  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_user_id, target_description, details)
  VALUES (v_admin_id, v_admin_email, p_action, p_target_user_id, p_target_description, p_details);
END $$;

-- Grant execute on the helper function to authenticated
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, uuid, text, jsonb) TO authenticated;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log (admin_id);
