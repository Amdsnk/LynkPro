-- Budget Variance System
CREATE TYPE cost_category_type AS ENUM ('labor', 'materials', 'equipment', 'subcontractor', 'overhead', 'other');

-- Cost categories table
CREATE TABLE cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_type cost_category_type NOT NULL,
  budgeted_amount numeric(12,2) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Actual costs table
CREATE TABLE actual_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_category_id uuid NOT NULL REFERENCES cost_categories(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  cost_date date NOT NULL,
  description text NOT NULL,
  vendor text,
  invoice_number text,
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Budget variance view
CREATE OR REPLACE VIEW budget_variance_view AS
SELECT 
  cc.id AS category_id,
  cc.firm_id,
  cc.project_id,
  cc.name AS category_name,
  cc.category_type,
  cc.budgeted_amount,
  COALESCE(SUM(ac.amount), 0) AS actual_amount,
  cc.budgeted_amount - COALESCE(SUM(ac.amount), 0) AS variance,
  CASE 
    WHEN cc.budgeted_amount > 0 THEN 
      ROUND(((COALESCE(SUM(ac.amount), 0) / cc.budgeted_amount) * 100)::numeric, 2)
    ELSE 0
  END AS utilization_percentage,
  CASE
    WHEN COALESCE(SUM(ac.amount), 0) > cc.budgeted_amount THEN 'over_budget'
    WHEN COALESCE(SUM(ac.amount), 0) > (cc.budgeted_amount * 0.9) THEN 'near_budget'
    ELSE 'within_budget'
  END AS status
FROM cost_categories cc
LEFT JOIN actual_costs ac ON cc.id = ac.cost_category_id
GROUP BY cc.id, cc.firm_id, cc.project_id, cc.name, cc.category_type, cc.budgeted_amount;

-- Indexes for performance
CREATE INDEX idx_cost_categories_firm ON cost_categories(firm_id);
CREATE INDEX idx_cost_categories_project ON cost_categories(project_id);
CREATE INDEX idx_cost_categories_type ON cost_categories(category_type);
CREATE INDEX idx_actual_costs_firm ON actual_costs(firm_id);
CREATE INDEX idx_actual_costs_project ON actual_costs(project_id);
CREATE INDEX idx_actual_costs_category ON actual_costs(cost_category_id);
CREATE INDEX idx_actual_costs_date ON actual_costs(cost_date);

-- RLS Policies
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_costs ENABLE ROW LEVEL SECURITY;

-- Cost categories policies
CREATE POLICY "Users can view cost categories in their firm"
  ON cost_categories FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage cost categories"
  ON cost_categories FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Actual costs policies
CREATE POLICY "Users can view actual costs in their firm"
  ON actual_costs FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage actual costs"
  ON actual_costs FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cost_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE actual_costs;

-- Function to update cost category timestamp
CREATE OR REPLACE FUNCTION update_cost_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cost_category_timestamp
BEFORE UPDATE ON cost_categories
FOR EACH ROW
EXECUTE FUNCTION update_cost_category_timestamp();