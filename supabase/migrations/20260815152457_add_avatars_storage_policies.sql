/*
# Add storage policies for avatars bucket

1. Security (Storage RLS policies on storage.objects)
- Authenticated users can INSERT (upload) objects only into folders named after their own user ID.
- Anyone (anon + authenticated) can SELECT (read) avatar objects — avatars are public.
- Authenticated users can UPDATE and DELETE only their own avatar objects.
2. Notes
- `storage.foldername(name)` returns text[] — the folder path segments as an array.
- We use `auth.uid()::text = ANY(storage.foldername(name))` to check if the user's ID
  appears as a folder segment in the object path (e.g. `uid/avatar.jpg`).
*/

-- SELECT: anyone can read avatars (public bucket)
DROP POLICY IF EXISTS "avatar_public_read" ON storage.objects;
CREATE POLICY "avatar_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- INSERT: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "avatar_insert_own" ON storage.objects;
CREATE POLICY "avatar_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = ANY(storage.foldername(name)));

-- UPDATE: authenticated users can update only their own avatar
DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = ANY(storage.foldername(name)))
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = ANY(storage.foldername(name)));

-- DELETE: authenticated users can delete only their own avatar
DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;
CREATE POLICY "avatar_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = ANY(storage.foldername(name)));
