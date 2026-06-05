-- Create filter_presets table for storing report filter configurations
CREATE TABLE IF NOT EXISTS filter_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter_config jsonb NOT NULL,
  report_type text NOT NULL,
  is_shared boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_filter_presets_firm_id ON filter_presets(firm_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_created_by ON filter_presets(created_by);
CREATE INDEX IF NOT EXISTS idx_filter_presets_report_type ON filter_presets(report_type);

-- Enable RLS
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user belongs to firm
CREATE OR REPLACE FUNCTION can_access_filter_preset(preset_firm_id uuid, preset_created_by uuid, preset_is_shared boolean)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.firm_id = preset_firm_id
    AND (preset_is_shared = true OR preset_created_by = auth.uid())
  );
$$;

-- RLS Policies
-- Users can view presets from their firm (shared presets or their own)
CREATE POLICY "Users can view filter presets from their firm"
  ON filter_presets
  FOR SELECT
  TO authenticated
  USING (can_access_filter_preset(firm_id, created_by, is_shared));

-- Users can create their own presets
CREATE POLICY "Users can create filter presets"
  ON filter_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = filter_presets.firm_id
    )
  );

-- Users can update their own presets
CREATE POLICY "Users can update their own filter presets"
  ON filter_presets
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own presets
CREATE POLICY "Users can delete their own filter presets"
  ON filter_presets
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());