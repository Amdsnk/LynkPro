-- Create proposal_status enum
DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  terms TEXT,
  valid_until DATE,
  status proposal_status NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create proposal_items table
CREATE TABLE IF NOT EXISTS proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_firm_id ON proposals(firm_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal_id ON proposal_items(proposal_id);

-- RLS Policies
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

-- Function to check if user can access proposal
CREATE OR REPLACE FUNCTION can_access_proposal(proposal_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND firm_id = proposal_firm_id
  );
$$;

-- Users can view proposals from their firm
CREATE POLICY "Users can view firm proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (can_access_proposal(firm_id));

-- Admins and staff can create proposals
CREATE POLICY "Users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = proposals.firm_id
      AND role IN ('admin', 'staff')
    )
  );

-- Admins and staff can update proposals
CREATE POLICY "Users can update proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = proposals.firm_id
      AND role IN ('admin', 'staff')
    )
  );

-- Admins can delete proposals
CREATE POLICY "Admins can delete proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = proposals.firm_id
      AND role = 'admin'
    )
  );

-- Proposal items policies
CREATE POLICY "Users can view proposal items"
  ON proposal_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_items.proposal_id
      AND can_access_proposal(proposals.firm_id)
    )
  );

CREATE POLICY "Users can manage proposal items"
  ON proposal_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = proposal_items.proposal_id
      AND p.firm_id = pr.firm_id
      AND pr.role IN ('admin', 'staff')
    )
  );