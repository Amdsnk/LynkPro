-- Compliance Requirements Table
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_type TEXT,
  requirement_name TEXT NOT NULL,
  description TEXT,
  regulation_reference TEXT,
  frequency TEXT,
  responsible_party TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_firm_id ON compliance_requirements(firm_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_project_type ON compliance_requirements(project_type);

-- RLS Policies
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements from their firm"
  ON compliance_requirements FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create requirements for their firm"
  ON compliance_requirements FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update requirements from their firm"
  ON compliance_requirements FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete requirements from their firm"
  ON compliance_requirements FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));