/*
# Friendships & Friend Requests

1. New Tables
- `friendships`: Tracks friend relationships between players.
  - `requester_id` (uuid, FK profiles) — who sent the request.
  - `addressee_id` (uuid, FK profiles) — who received the request.
  - `status` (text) — 'pending' | 'accepted' | 'declined'. Default 'pending'.
  - `created_at` (timestamptz) — when the request was made.
  - `responded_at` (timestamptz, nullable) — when the addressee responded.
  - Primary key: (requester_id, addressee_id) — one request per ordered pair.

2. Security (RLS)
- RLS enabled on `friendships`.
- SELECT: A user can read rows where they are the requester OR the addressee.
- INSERT: A user can insert a row only if they are the requester (auth.uid() = requester_id).
- UPDATE: A user can update a row only if they are the addressee (to accept/decline). The requester cannot modify status after sending.
- DELETE: A user can delete a row if they are the requester or addressee (cancel / unfriend).

3. Indexes
- Index on addressee_id for fast "incoming requests" queries.
- Index on requester_id for fast "outgoing requests" queries.
*/

CREATE TABLE IF NOT EXISTS public.friendships (
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  PRIMARY KEY (requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select_participants" ON public.friendships;
CREATE POLICY "friendships_select_participants" ON public.friendships FOR SELECT
  TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_insert_requester" ON public.friendships;
CREATE POLICY "friendships_insert_requester" ON public.friendships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_update_addressee" ON public.friendships;
CREATE POLICY "friendships_update_addressee" ON public.friendships FOR UPDATE
  TO authenticated USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_delete_participant" ON public.friendships;
CREATE POLICY "friendships_delete_participant" ON public.friendships FOR DELETE
  TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
