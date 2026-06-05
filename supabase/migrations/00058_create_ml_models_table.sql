-- ML Models table for storing trained model metadata
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- delay_prediction, budget_forecast, safety_risk, material_demand, issue_detection
  version TEXT NOT NULL,
  training_data_range DATERANGE,
  accuracy_metrics JSONB,
  deployed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Predictions table for storing prediction results
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
  firm_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- delay, budget_overrun, material_demand, safety_risk, issue_detection
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  actual_outcome JSONB,
  feedback_score INTEGER, -- 1-5 rating from users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_ml_models_firm_id ON ml_models(firm_id);
CREATE INDEX idx_ml_models_type ON ml_models(model_type);
CREATE INDEX idx_ml_models_active ON ml_models(is_active) WHERE is_active = true;

CREATE INDEX idx_ml_predictions_firm_id ON ml_predictions(firm_id);
CREATE INDEX idx_ml_predictions_project_id ON ml_predictions(project_id);
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX idx_ml_predictions_created_at ON ml_predictions(created_at DESC);
CREATE INDEX idx_ml_predictions_confidence ON ml_predictions(confidence_score DESC);

-- RLS Policies
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- ML Models policies
CREATE POLICY "Users can view their firm's models"
  ON ml_models FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage models"
  ON ml_models FOR ALL
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ML Predictions policies
CREATE POLICY "Users can view their firm's predictions"
  ON ml_predictions FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create predictions"
  ON ml_predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's predictions"
  ON ml_predictions FOR UPDATE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE ml_models IS 'Stores ML model metadata and versioning';
COMMENT ON TABLE ml_predictions IS 'Stores AI prediction results with confidence scores';
COMMENT ON COLUMN ml_predictions.prediction_data IS 'JSONB containing prediction details, varies by type';
COMMENT ON COLUMN ml_predictions.actual_outcome IS 'JSONB containing actual outcome for accuracy tracking';
COMMENT ON COLUMN ml_predictions.feedback_score IS 'User feedback rating (1-5) for prediction quality';