-- Create material_forecasts table
CREATE TABLE material_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_quantity DECIMAL NOT NULL CHECK (predicted_quantity >= 0),
  confidence_level DECIMAL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  lead_time_days INT CHECK (lead_time_days >= 0),
  reorder_point DECIMAL CHECK (reorder_point >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_material_forecasts_firm ON material_forecasts(firm_id);
CREATE INDEX idx_material_forecasts_project ON material_forecasts(project_id);
CREATE INDEX idx_material_forecasts_material ON material_forecasts(material_id);
CREATE INDEX idx_material_forecasts_date ON material_forecasts(forecast_date);

-- Enable RLS
ALTER TABLE material_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view material forecasts from their firm"
  ON material_forecasts FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert material forecasts for their firm"
  ON material_forecasts FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update material forecasts for their firm"
  ON material_forecasts FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete material forecasts for their firm"
  ON material_forecasts FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));