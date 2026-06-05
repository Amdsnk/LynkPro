-- Safety Audit Templates Table
CREATE TABLE IF NOT EXISTS safety_audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regulation TEXT,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_audit_templates_firm_id ON safety_audit_templates(firm_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_templates_regulation ON safety_audit_templates(regulation);

-- RLS Policies
ALTER TABLE safety_audit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their firm"
  ON safety_audit_templates FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create templates for their firm"
  ON safety_audit_templates FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update templates from their firm"
  ON safety_audit_templates FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete templates from their firm"
  ON safety_audit_templates FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));