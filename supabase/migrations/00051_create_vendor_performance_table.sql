-- Create vendor_performance table
CREATE TABLE vendor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID,
  delivery_date DATE,
  promised_date DATE,
  on_time BOOLEAN,
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vendor_performance_vendor ON vendor_performance(vendor_id);
CREATE INDEX idx_vendor_performance_delivery_date ON vendor_performance(delivery_date);

-- Enable RLS
ALTER TABLE vendor_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vendor performance for their firm vendors"
  ON vendor_performance FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can insert vendor performance for their firm vendors"
  ON vendor_performance FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can update vendor performance for their firm vendors"
  ON vendor_performance FOR UPDATE
  USING (vendor_id IN (SELECT id FROM vendors WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can delete vendor performance for their firm vendors"
  ON vendor_performance FOR DELETE
  USING (vendor_id IN (SELECT id FROM vendors WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));