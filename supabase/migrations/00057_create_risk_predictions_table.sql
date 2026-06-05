-- Risk Predictions Table
CREATE TABLE IF NOT EXISTS risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prediction_date DATE NOT NULL,
  high_risk_activities JSONB DEFAULT '[]'::jsonb,
  predicted_risk_score DECIMAL(5,2),
  confidence_level DECIMAL(3,2),
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_predictions_firm_id ON risk_predictions(firm_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_project_id ON risk_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_prediction_date ON risk_predictions(prediction_date);

-- RLS Policies
ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictions from their firm"
  ON risk_predictions FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create predictions for their firm"
  ON risk_predictions FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update predictions from their firm"
  ON risk_predictions FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete predictions from their firm"
  ON risk_predictions FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));