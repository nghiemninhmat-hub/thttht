CREATE POLICY "site_pages_anon_select"
  ON site_pages FOR SELECT
  TO anon
  USING (true);
