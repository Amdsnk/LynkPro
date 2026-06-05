-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_firm_id ON invitations(firm_id);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Function to check if user can manage invitations
CREATE OR REPLACE FUNCTION can_manage_invitations(invitation_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND firm_id = invitation_firm_id
    AND role IN ('admin', 'staff')
  );
$$;

-- Admins and staff can view invitations from their firm
CREATE POLICY "Users can view firm invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (can_manage_invitations(firm_id));

-- Admins and staff can create invitations
CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_invitations(firm_id));

-- Admins and staff can delete invitations
CREATE POLICY "Users can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (can_manage_invitations(firm_id));

-- Public can view invitation by token (for registration)
CREATE POLICY "Anyone can view invitation by token"
  ON invitations FOR SELECT
  TO anon
  USING (expires_at > NOW() AND accepted_at IS NULL);