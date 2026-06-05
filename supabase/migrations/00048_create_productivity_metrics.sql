-- Create productivity_metrics table
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trade TEXT,
  crew_id UUID,
  hours_worked DECIMAL(10, 2) DEFAULT 0,
  units_completed DECIMAL(10, 2) DEFAULT 0,
  unit_type TEXT,
  productivity_rate DECIMAL(10, 4),
  weather_condition TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_firm ON productivity_metrics(firm_id);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_project ON productivity_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_date ON productivity_metrics(date);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_trade ON productivity_metrics(trade);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_crew ON productivity_metrics(crew_id);

-- Enable RLS
ALTER TABLE productivity_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view productivity metrics from their firm"
  ON productivity_metrics FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create productivity metrics for their firm"
  ON productivity_metrics FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update productivity metrics from their firm"
  ON productivity_metrics FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete productivity metrics from their firm"
  ON productivity_metrics FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Update trigger
CREATE OR REPLACE FUNCTION update_productivity_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_productivity_metrics_updated_at
  BEFORE UPDATE ON productivity_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_productivity_metrics_updated_at();

-- Auto-calculate productivity rate trigger
CREATE OR REPLACE FUNCTION calculate_productivity_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hours_worked > 0 AND NEW.units_completed > 0 THEN
    NEW.productivity_rate := NEW.units_completed / NEW.hours_worked;
  ELSE
    NEW.productivity_rate := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_productivity_rate
  BEFORE INSERT OR UPDATE ON productivity_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_productivity_rate();