-- Create asset_qr_codes table
CREATE TABLE IF NOT EXISTS asset_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('material', 'equipment', 'tool', 'vehicle')),
  asset_id uuid NOT NULL,
  qr_code_data text NOT NULL UNIQUE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  last_scanned_at timestamptz,
  scan_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create qr_scan_history table
CREATE TABLE IF NOT EXISTS qr_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  qr_code_id uuid NOT NULL REFERENCES asset_qr_codes(id) ON DELETE CASCADE,
  scanned_by uuid NOT NULL REFERENCES auth.users(id),
  scan_type text NOT NULL CHECK (scan_type IN ('check_in', 'check_out', 'inspection', 'maintenance', 'transfer', 'view')),
  project_id uuid REFERENCES projects(id),
  location_name text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  notes text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_qr_codes_firm_id ON asset_qr_codes(firm_id);
CREATE INDEX IF NOT EXISTS idx_asset_qr_codes_asset_type ON asset_qr_codes(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_qr_codes_asset_id ON asset_qr_codes(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_qr_codes_qr_code_data ON asset_qr_codes(qr_code_data);

CREATE INDEX IF NOT EXISTS idx_qr_scan_history_firm_id ON qr_scan_history(firm_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_qr_code_id ON qr_scan_history(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_scanned_by ON qr_scan_history(scanned_by);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_scanned_at ON qr_scan_history(scanned_at DESC);

-- Enable RLS
ALTER TABLE asset_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_qr_codes
CREATE POLICY "Users can view firm QR codes"
  ON asset_qr_codes FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create QR codes"
  ON asset_qr_codes FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update firm QR codes"
  ON asset_qr_codes FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete firm QR codes"
  ON asset_qr_codes FOR DELETE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for qr_scan_history
CREATE POLICY "Users can view firm scan history"
  ON qr_scan_history FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create scan records"
  ON qr_scan_history FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()) AND scanned_by = auth.uid());

-- Function to update scan count
CREATE OR REPLACE FUNCTION update_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE asset_qr_codes
  SET scan_count = scan_count + 1,
      last_scanned_at = NEW.scanned_at
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update scan count
CREATE TRIGGER trigger_update_qr_scan_count
  AFTER INSERT ON qr_scan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_scan_count();

-- Comments
COMMENT ON TABLE asset_qr_codes IS 'QR codes for materials, equipment, and other assets';
COMMENT ON TABLE qr_scan_history IS 'History of QR code scans with location and purpose';