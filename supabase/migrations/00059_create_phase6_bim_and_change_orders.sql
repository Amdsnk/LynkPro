-- BIM Models table
CREATE TABLE bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIM Issues table (links issues to model locations)
CREATE TABLE bim_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES bim_models(id) ON DELETE CASCADE,
  issue_id UUID,
  firm_id UUID NOT NULL,
  model_coordinates JSONB,
  element_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Orders table
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_by UUID NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  cost_impact DECIMAL(15,2),
  schedule_impact_days INT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approval_date DATE,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(firm_id, co_number)
);

-- Indexes for BIM Models
CREATE INDEX idx_bim_models_firm_id ON bim_models(firm_id);
CREATE INDEX idx_bim_models_project_id ON bim_models(project_id);
CREATE INDEX idx_bim_models_upload_date ON bim_models(upload_date DESC);

-- Indexes for BIM Issues
CREATE INDEX idx_bim_issues_model_id ON bim_issues(model_id);
CREATE INDEX idx_bim_issues_firm_id ON bim_issues(firm_id);
CREATE INDEX idx_bim_issues_status ON bim_issues(status);

-- Indexes for Change Orders
CREATE INDEX idx_change_orders_firm_id ON change_orders(firm_id);
CREATE INDEX idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX idx_change_orders_status ON change_orders(status);
CREATE INDEX idx_change_orders_request_date ON change_orders(request_date DESC);

-- RLS Policies for BIM Models
ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's BIM models"
  ON bim_models FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create BIM models"
  ON bim_models FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's BIM models"
  ON bim_models FOR UPDATE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their firm's BIM models"
  ON bim_models FOR DELETE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for BIM Issues
ALTER TABLE bim_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's BIM issues"
  ON bim_issues FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create BIM issues"
  ON bim_issues FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's BIM issues"
  ON bim_issues FOR UPDATE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for Change Orders
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's change orders"
  ON change_orders FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create change orders"
  ON change_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's change orders"
  ON change_orders FOR UPDATE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE bim_models IS 'Stores BIM model files and metadata';
COMMENT ON TABLE bim_issues IS 'Links issues to specific BIM model locations';
COMMENT ON TABLE change_orders IS 'Tracks project change orders with approval workflow';
COMMENT ON COLUMN change_orders.status IS 'pending, approved, rejected, implemented';