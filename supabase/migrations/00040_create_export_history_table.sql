-- Create export_history table
CREATE TABLE IF NOT EXISTS export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  report_type text NOT NULL,
  report_name text NOT NULL,
  export_format text NOT NULL CHECK (export_format IN ('CSV', 'Excel', 'PDF')),
  filter_config jsonb,
  exported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_history_firm_id ON export_history(firm_id);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_report_type ON export_history(report_type);
CREATE INDEX IF NOT EXISTS idx_export_history_exported_at ON export_history(exported_at DESC);

-- Enable RLS
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: Users can view export history for their firm
CREATE POLICY "Users can view firm export history"
  ON export_history
  FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Insert: Authenticated users can create export history records
CREATE POLICY "Users can create export history"
  ON export_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Comment on table
COMMENT ON TABLE export_history IS 'Tracks all report exports with metadata and filter configurations';