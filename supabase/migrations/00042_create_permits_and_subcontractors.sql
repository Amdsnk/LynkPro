-- Create permits table
CREATE TABLE IF NOT EXISTS permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  permit_number text NOT NULL,
  permit_type text NOT NULL,
  permit_name text NOT NULL,
  issuing_authority text NOT NULL,
  issue_date date NOT NULL,
  expiration_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'expired', 'renewed', 'rejected')),
  document_url text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create subcontractors table
CREATE TABLE IF NOT EXISTS subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  specialty text NOT NULL,
  license_number text,
  insurance_expiry date,
  rating decimal(3, 2) CHECK (rating >= 0 AND rating <= 5),
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'blacklisted')) DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create subcontractor_assignments table
CREATE TABLE IF NOT EXISTS subcontractor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  task_description text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  contract_amount decimal(15, 2) NOT NULL,
  paid_amount decimal(15, 2) DEFAULT 0,
  status text NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
  performance_rating decimal(3, 2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create purchase_requisitions table
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requisition_number text NOT NULL UNIQUE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  material_name text NOT NULL,
  quantity decimal(15, 2) NOT NULL,
  unit text NOT NULL,
  estimated_cost decimal(15, 2) NOT NULL,
  vendor_name text,
  required_by date NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received', 'cancelled')) DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permits_firm_id ON permits(firm_id);
CREATE INDEX IF NOT EXISTS idx_permits_project_id ON permits(project_id);
CREATE INDEX IF NOT EXISTS idx_permits_expiration_date ON permits(expiration_date);
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);

CREATE INDEX IF NOT EXISTS idx_subcontractors_firm_id ON subcontractors(firm_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON subcontractors(status);

CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_firm_id ON subcontractor_assignments(firm_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_project_id ON subcontractor_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_assignments_subcontractor_id ON subcontractor_assignments(subcontractor_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_firm_id ON purchase_requisitions(firm_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_project_id ON purchase_requisitions(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);

-- Enable RLS
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permits
CREATE POLICY "Users can view firm permits"
  ON permits FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create permits"
  ON permits FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update firm permits"
  ON permits FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete firm permits"
  ON permits FOR DELETE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for subcontractors
CREATE POLICY "Users can view firm subcontractors"
  ON subcontractors FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create subcontractors"
  ON subcontractors FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update firm subcontractors"
  ON subcontractors FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete firm subcontractors"
  ON subcontractors FOR DELETE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for subcontractor_assignments
CREATE POLICY "Users can view firm subcontractor assignments"
  ON subcontractor_assignments FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create subcontractor assignments"
  ON subcontractor_assignments FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update firm subcontractor assignments"
  ON subcontractor_assignments FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete firm subcontractor assignments"
  ON subcontractor_assignments FOR DELETE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for purchase_requisitions
CREATE POLICY "Users can view firm purchase requisitions"
  ON purchase_requisitions FOR SELECT TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create purchase requisitions"
  ON purchase_requisitions FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "Users can update firm purchase requisitions"
  ON purchase_requisitions FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own purchase requisitions"
  ON purchase_requisitions FOR DELETE TO authenticated
  USING (requested_by = auth.uid());

-- Comments
COMMENT ON TABLE permits IS 'Project permits with expiration tracking';
COMMENT ON TABLE subcontractors IS 'Subcontractor database with ratings and status';
COMMENT ON TABLE subcontractor_assignments IS 'Subcontractor task assignments and payment tracking';
COMMENT ON TABLE purchase_requisitions IS 'Material purchase requisitions with approval workflow';