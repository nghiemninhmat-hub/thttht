/*
# Threaded comments for forum posts

1. Purpose
- Players can comment on forum posts and reply to other comments (one level of nesting).
- Comments are anonymous to other players and friends — only the author and admins see the real identity.
- Authors can delete their own comments; admins can delete any comment.

2. New Table: post_comments
- id (uuid, primary key)
- post_id (uuid, FK to posts, cascade delete)
- author_id (uuid, FK to profiles, cascade delete)
- parent_comment_id (uuid, FK to post_comments, nullable, cascade delete) — NULL = top-level comment, non-NULL = reply
- content (text, not null)
- created_at (timestamptz, default now)

3. Security (RLS)
- SELECT: authenticated users can read all comments (community discussion). The join to profiles returns anonymous_name + oc_name, but the frontend only displays anonymous_name for non-admin viewers (enforced in UI). oc_name is needed so admins can reveal identity.
- INSERT: authenticated users can insert comments where author_id = auth.uid().
- DELETE: authenticated users can delete their own comments; admins (is_admin()) can delete any comment.
- No UPDATE — comments are immutable once posted.

4. Notes
- Safe to re-run: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE.
- One level of nesting (reply to a comment, not reply-to-reply). parent_comment_id references a top-level comment; the UI prevents deeper nesting.
- Does NOT alter existing tables or columns — no data loss risk.
*/

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read comments (community discussion)
DROP POLICY IF EXISTS "post_comments_select_all" ON public.post_comments;
CREATE POLICY "post_comments_select_all" ON public.post_comments FOR SELECT
  TO authenticated USING (true);

-- Users can insert their own comments
DROP POLICY IF EXISTS "post_comments_insert_own" ON public.post_comments;
CREATE POLICY "post_comments_insert_own" ON public.post_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "post_comments_delete_own" ON public.post_comments;
CREATE POLICY "post_comments_delete_own" ON public.post_comments FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Admins can delete any comment
DROP POLICY IF EXISTS "post_comments_admin_delete" ON public.post_comments;
CREATE POLICY "post_comments_admin_delete" ON public.post_comments FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id);
