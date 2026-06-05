-- Compliance Tracking Table
CREATE TABLE IF NOT EXISTS compliance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  last_checked DATE,
  next_check_due DATE,
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_firm_id ON compliance_tracking(firm_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_project_id ON compliance_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_requirement_id ON compliance_tracking(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON compliance_tracking(status);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_next_check_due ON compliance_tracking(next_check_due);

-- RLS Policies
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracking from their firm"
  ON compliance_tracking FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create tracking for their firm"
  ON compliance_tracking FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update tracking from their firm"
  ON compliance_tracking FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete tracking from their firm"
  ON compliance_tracking FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));