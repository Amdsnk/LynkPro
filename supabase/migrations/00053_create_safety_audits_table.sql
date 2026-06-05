-- Safety Audits Table
CREATE TABLE IF NOT EXISTS safety_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES safety_audit_templates(id) ON DELETE SET NULL,
  audit_date DATE NOT NULL,
  auditor_id UUID NOT NULL REFERENCES profiles(id),
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score DECIMAL(5,2),
  corrective_actions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_audits_firm_id ON safety_audits(firm_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_project_id ON safety_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_template_id ON safety_audits(template_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_audit_date ON safety_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_safety_audits_auditor_id ON safety_audits(auditor_id);

-- RLS Policies
ALTER TABLE safety_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits from their firm"
  ON safety_audits FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create audits for their firm"
  ON safety_audits FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update audits from their firm"
  ON safety_audits FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete audits from their firm"
  ON safety_audits FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));