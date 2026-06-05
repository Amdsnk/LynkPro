-- Material Tracking System
CREATE TYPE material_unit AS ENUM ('kg', 'ton', 'liter', 'm3', 'piece', 'box', 'bag');
CREATE TYPE material_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'on_order');

-- Materials table
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit material_unit NOT NULL DEFAULT 'piece',
  current_quantity numeric(10,2) NOT NULL DEFAULT 0,
  min_quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit_cost numeric(10,2),
  status material_status NOT NULL DEFAULT 'in_stock',
  supplier_name text,
  supplier_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Material deliveries table
CREATE TABLE material_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(10,2),
  total_cost numeric(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
  delivery_date date NOT NULL,
  received_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Material consumption table
CREATE TABLE material_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL,
  consumed_date date NOT NULL,
  consumed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  activity text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_materials_firm ON materials(firm_id);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_material_deliveries_firm ON material_deliveries(firm_id);
CREATE INDEX idx_material_deliveries_material ON material_deliveries(material_id);
CREATE INDEX idx_material_deliveries_project ON material_deliveries(project_id);
CREATE INDEX idx_material_consumption_firm ON material_consumption(firm_id);
CREATE INDEX idx_material_consumption_material ON material_consumption(material_id);
CREATE INDEX idx_material_consumption_project ON material_consumption(project_id);

-- RLS Policies
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_consumption ENABLE ROW LEVEL SECURITY;

-- Materials policies
CREATE POLICY "Users can view materials in their firm"
  ON materials FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage materials"
  ON materials FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Material deliveries policies
CREATE POLICY "Users can view deliveries in their firm"
  ON material_deliveries FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage deliveries"
  ON material_deliveries FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Material consumption policies
CREATE POLICY "Users can view consumption in their firm"
  ON material_consumption FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage consumption"
  ON material_consumption FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE materials;
ALTER PUBLICATION supabase_realtime ADD TABLE material_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE material_consumption;

-- Function to update material quantity after delivery
CREATE OR REPLACE FUNCTION update_material_quantity_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE materials
  SET current_quantity = current_quantity + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_material_on_delivery
AFTER INSERT ON material_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_material_quantity_on_delivery();

-- Function to update material quantity after consumption
CREATE OR REPLACE FUNCTION update_material_quantity_on_consumption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE materials
  SET current_quantity = current_quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_material_on_consumption
AFTER INSERT ON material_consumption
FOR EACH ROW
EXECUTE FUNCTION update_material_quantity_on_consumption();

-- Function to update material status based on quantity
CREATE OR REPLACE FUNCTION update_material_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_quantity <= 0 THEN
    NEW.status = 'out_of_stock';
  ELSIF NEW.current_quantity <= NEW.min_quantity THEN
    NEW.status = 'low_stock';
  ELSE
    NEW.status = 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_status
BEFORE UPDATE OF current_quantity ON materials
FOR EACH ROW
EXECUTE FUNCTION update_material_status();