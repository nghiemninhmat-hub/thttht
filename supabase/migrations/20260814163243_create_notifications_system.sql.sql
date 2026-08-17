/*
# Create notifications system for players and admins

## Overview
Creates a notifications table and database triggers that automatically generate
notifications for friend requests, accepted friendships, messages, new registrations,
and new forum posts.

## 1. New Table: notifications
- id (uuid PK), recipient_id (uuid FK auth.users, nullable for admin broadcasts),
  type, title, body, link, is_read (bool default false), created_at

## 2. Security (RLS)
- SELECT: own notifications + admin broadcasts (for admins)
- UPDATE: mark own/admin broadcasts as read
- DELETE: delete own/admin broadcasts
- No INSERT policy — only SECURITY DEFINER trigger functions insert

## 3. Triggers
- on_friendship_insert → friend_request to addressee
- on_friendship_update → friend_accepted to requester
- on_message_insert → message to receiver
- on_profile_insert → admin_registration (broadcast)
- on_post_insert → admin_post (broadcast)
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()));

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()))
  WITH CHECK (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()));

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()));

-- ===== Trigger: friend request notification =====
CREATE OR REPLACE FUNCTION create_friendship_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  requester_name text;
BEGIN
  SELECT oc_name INTO requester_name FROM profiles WHERE id = NEW.requester_id;
  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    NEW.addressee_id,
    'friend_request',
    'Lời mời kết bạn mới',
    COALESCE(requester_name, 'Một người chơi') || ' muốn kết bạn với bạn',
    '/messages'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_friendship_notification() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_friendship_insert ON friendships;
CREATE TRIGGER on_friendship_insert
  AFTER INSERT ON friendships
  FOR EACH ROW EXECUTE FUNCTION create_friendship_notification();

-- ===== Trigger: friend accepted notification =====
CREATE OR REPLACE FUNCTION create_friendship_accepted_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  accepter_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT oc_name INTO accepter_name FROM profiles WHERE id = NEW.addressee_id;
    INSERT INTO notifications (recipient_id, type, title, body, link)
    VALUES (
      NEW.requester_id,
      'friend_accepted',
      'Lời mời kết bạn được chấp nhận',
      COALESCE(accepter_name, 'Một người chơi') || ' đã chấp nhận lời mời kết bạn của bạn',
      '/messages'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_friendship_accepted_notification() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_friendship_update ON friendships;
CREATE TRIGGER on_friendship_update
  AFTER UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION create_friendship_accepted_notification();

-- ===== Trigger: message notification =====
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT oc_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    NEW.receiver_id,
    'message',
    'Thư tín mới',
    COALESCE(sender_name, 'Một người chơi') || ' đã gửi cho bạn một thư tín',
    '/messages'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_message_notification() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- ===== Trigger: admin registration notification =====
CREATE OR REPLACE FUNCTION create_registration_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_approved = false THEN
    INSERT INTO notifications (recipient_id, type, title, body, link)
    VALUES (
      NULL,
      'admin_registration',
      'Tài khoản chờ phê duyệt',
      NEW.oc_name || ' (' || NEW.email || ') vừa đăng ký, đang chờ phê duyệt',
      '/admin'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_registration_notification() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_profile_insert ON profiles;
CREATE TRIGGER on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_registration_notification();

-- ===== Trigger: admin post notification =====
CREATE OR REPLACE FUNCTION create_post_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  author_name text;
BEGIN
  SELECT oc_name INTO author_name FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    NULL,
    'admin_post',
    'Bài viết mới trên diễn đàn',
    COALESCE(author_name, 'Không xác định') || ' đăng bài: ' || NEW.title,
    '/forum'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_post_notification() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_post_insert ON posts;
CREATE TRIGGER on_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION create_post_notification();