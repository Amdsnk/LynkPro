-- Create vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  rating DECIMAL CHECK (rating >= 1 AND rating <= 5),
  on_time_delivery_rate DECIMAL CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  average_lead_time_days INT CHECK (average_lead_time_days >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vendors_firm ON vendors(firm_id);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_status ON vendors(status);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vendors from their firm"
  ON vendors FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert vendors for their firm"
  ON vendors FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update vendors for their firm"
  ON vendors FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete vendors for their firm"
  ON vendors FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));