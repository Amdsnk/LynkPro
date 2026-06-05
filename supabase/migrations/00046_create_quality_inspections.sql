-- Create enums
CREATE TYPE inspection_status AS ENUM ('pass', 'fail', 'conditional');
CREATE TYPE item_status AS ENUM ('pass', 'fail', 'na');

-- Create inspection_templates table
CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT,
  description TEXT,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quality_inspections table
CREATE TABLE IF NOT EXISTS quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES inspection_templates(id),
  inspection_date DATE NOT NULL,
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  location TEXT,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_status inspection_status NOT NULL,
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspection_templates_firm ON inspection_templates(firm_id);
CREATE INDEX IF NOT EXISTS idx_inspection_templates_trade ON inspection_templates(trade);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_project ON quality_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_firm ON quality_inspections(firm_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_template ON quality_inspections(template_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_status ON quality_inspections(overall_status);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_date ON quality_inspections(inspection_date);

-- Enable RLS
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_templates
CREATE POLICY "Users can view templates from their firm"
  ON inspection_templates FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create templates for their firm"
  ON inspection_templates FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update templates from their firm"
  ON inspection_templates FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete templates from their firm"
  ON inspection_templates FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for quality_inspections
CREATE POLICY "Users can view inspections from their firm"
  ON quality_inspections FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create inspections for their firm"
  ON quality_inspections FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND inspector_id = auth.uid()
  );

CREATE POLICY "Users can update inspections from their firm"
  ON quality_inspections FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete inspections from their firm"
  ON quality_inspections FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Update triggers
CREATE OR REPLACE FUNCTION update_inspection_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inspection_templates_updated_at
  BEFORE UPDATE ON inspection_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_inspection_templates_updated_at();

CREATE OR REPLACE FUNCTION update_quality_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quality_inspections_updated_at
  BEFORE UPDATE ON quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_inspections_updated_at();