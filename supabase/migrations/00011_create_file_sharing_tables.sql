-- Create file_shares table
CREATE TABLE IF NOT EXISTS file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  shared_with_email text,
  expires_at timestamptz,
  password_hash text,
  permission_level text NOT NULL CHECK (permission_level IN ('view', 'download')),
  custom_message text,
  view_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create share_access_logs table
CREATE TABLE IF NOT EXISTS share_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES file_shares(id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  action text NOT NULL CHECK (action IN ('view', 'download'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_share_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_created_by ON file_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_share_access_logs_share_id ON share_access_logs(share_id);
CREATE INDEX IF NOT EXISTS idx_share_access_logs_accessed_at ON share_access_logs(accessed_at DESC);

-- Enable RLS
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_shares
CREATE POLICY "Users can view shares they created"
ON file_shares FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create shares for their firm's files"
ON file_shares FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM files
    JOIN projects ON projects.id = files.project_id
    WHERE files.id = file_shares.file_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update their own shares"
ON file_shares FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own shares"
ON file_shares FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- RLS policies for share_access_logs
CREATE POLICY "Users can view access logs for their shares"
ON share_access_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM file_shares
    WHERE file_shares.id = share_access_logs.share_id
    AND file_shares.created_by = auth.uid()
  )
);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(share_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE file_shares
  SET view_count = view_count + 1,
      last_accessed_at = now()
  WHERE id = share_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log share access
CREATE OR REPLACE FUNCTION log_share_access(
  share_id_param uuid,
  ip_address_param text,
  user_agent_param text,
  action_param text
)
RETURNS void AS $$
BEGIN
  INSERT INTO share_access_logs (share_id, ip_address, user_agent, action)
  VALUES (share_id_param, ip_address_param, user_agent_param, action_param);
  
  -- Increment view count
  PERFORM increment_share_view_count(share_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
