-- Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  location TEXT,
  risk_score DECIMAL(5,2),
  risk_factors JSONB DEFAULT '{}'::jsonb,
  mitigation_measures JSONB DEFAULT '[]'::jsonb,
  assessed_by UUID NOT NULL REFERENCES profiles(id),
  assessment_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_assessments_firm_id ON risk_assessments(firm_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_project_id ON risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_score ON risk_assessments(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessment_date ON risk_assessments(assessment_date);

-- RLS Policies
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assessments from their firm"
  ON risk_assessments FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create assessments for their firm"
  ON risk_assessments FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update assessments from their firm"
  ON risk_assessments FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete assessments from their firm"
  ON risk_assessments FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));