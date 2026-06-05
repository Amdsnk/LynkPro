-- Create report_status enum
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  site_location TEXT,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  observations TEXT,
  recommendations TEXT,
  ai_narrative TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  status report_status NOT NULL DEFAULT 'draft',
  disclaimer TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_firm_id ON reports(firm_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Function to check if user can access report
CREATE OR REPLACE FUNCTION can_access_report(report_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND firm_id = report_firm_id
  );
$$;

-- Users can view reports from their firm
CREATE POLICY "Users can view firm reports"
  ON reports FOR SELECT
  TO authenticated
  USING (can_access_report(firm_id));

-- Admins and staff can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = reports.firm_id
      AND role IN ('admin', 'staff')
    )
  );

-- Admins and staff can update reports
CREATE POLICY "Users can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = reports.firm_id
      AND role IN ('admin', 'staff')
    )
  );

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND firm_id = reports.firm_id
      AND role = 'admin'
    )
  );