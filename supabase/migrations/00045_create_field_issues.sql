-- Create enums
CREATE TYPE issue_type AS ENUM ('rfi', 'deficiency', 'safety', 'quality', 'other');
CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create field_issues table
CREATE TABLE IF NOT EXISTS field_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issue_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_type issue_type NOT NULL DEFAULT 'other',
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'open',
  location TEXT,
  assigned_to UUID REFERENCES profiles(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issue_responses table
CREATE TABLE IF NOT EXISTS issue_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES field_issues(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  responded_by UUID NOT NULL REFERENCES profiles(id),
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate issue number
CREATE SEQUENCE IF NOT EXISTS issue_number_seq;

CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issue_number IS NULL OR NEW.issue_number = '' THEN
    NEW.issue_number := 'ISS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('issue_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_issue_number
  BEFORE INSERT ON field_issues
  FOR EACH ROW
  EXECUTE FUNCTION generate_issue_number();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_field_issues_project ON field_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_field_issues_firm ON field_issues(firm_id);
CREATE INDEX IF NOT EXISTS idx_field_issues_status ON field_issues(status);
CREATE INDEX IF NOT EXISTS idx_field_issues_assigned ON field_issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_field_issues_type ON field_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_field_issues_priority ON field_issues(priority);
CREATE INDEX IF NOT EXISTS idx_issue_responses_issue ON issue_responses(issue_id);

-- Enable RLS
ALTER TABLE field_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for field_issues
CREATE POLICY "Users can view issues from their firm"
  ON field_issues FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create issues for their firm"
  ON field_issues FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND reported_by = auth.uid()
  );

CREATE POLICY "Users can update issues from their firm"
  ON field_issues FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete issues from their firm"
  ON field_issues FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for issue_responses
CREATE POLICY "Users can view responses for issues from their firm"
  ON issue_responses FOR SELECT
  USING (issue_id IN (SELECT id FROM field_issues WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can create responses for issues from their firm"
  ON issue_responses FOR INSERT
  WITH CHECK (
    issue_id IN (SELECT id FROM field_issues WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()))
    AND responded_by = auth.uid()
  );

CREATE POLICY "Users can update their own responses"
  ON issue_responses FOR UPDATE
  USING (responded_by = auth.uid());

CREATE POLICY "Users can delete their own responses"
  ON issue_responses FOR DELETE
  USING (responded_by = auth.uid());

-- Update trigger
CREATE OR REPLACE FUNCTION update_field_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_field_issues_updated_at
  BEFORE UPDATE ON field_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_field_issues_updated_at();