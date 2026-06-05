-- Create daily_site_reports table
CREATE TABLE IF NOT EXISTS daily_site_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather_condition TEXT,
  temperature_high INT,
  temperature_low INT,
  workforce_count JSONB DEFAULT '{}'::jsonb,
  work_completed TEXT,
  materials_received JSONB DEFAULT '[]'::jsonb,
  equipment_on_site JSONB DEFAULT '[]'::jsonb,
  visitors JSONB DEFAULT '[]'::jsonb,
  issues TEXT,
  delays TEXT,
  safety_notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_project_report_date UNIQUE(project_id, report_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_site_reports_project ON daily_site_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_site_reports_date ON daily_site_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_site_reports_firm ON daily_site_reports(firm_id);
CREATE INDEX IF NOT EXISTS idx_daily_site_reports_created_by ON daily_site_reports(created_by);

-- Enable RLS
ALTER TABLE daily_site_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reports from their firm"
  ON daily_site_reports FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create reports for their firm"
  ON daily_site_reports FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update reports from their firm"
  ON daily_site_reports FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete reports from their firm"
  ON daily_site_reports FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Update trigger
CREATE OR REPLACE FUNCTION update_daily_site_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_daily_site_reports_updated_at
  BEFORE UPDATE ON daily_site_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_site_reports_updated_at();