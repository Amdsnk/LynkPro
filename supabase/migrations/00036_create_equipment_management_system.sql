-- Equipment Management System
CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'out_of_service');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'inspection');

-- Equipment table
CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  equipment_type text NOT NULL,
  model text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric(10,2),
  status equipment_status NOT NULL DEFAULT 'available',
  current_location text,
  current_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Equipment usage logs table
CREATE TABLE equipment_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_hours numeric(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
      ELSE NULL
    END
  ) STORED,
  fuel_consumed numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Equipment maintenance logs table
CREATE TABLE equipment_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cost numeric(10,2),
  description text NOT NULL,
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_equipment_firm ON equipment(firm_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_project ON equipment(current_project_id);
CREATE INDEX idx_equipment_usage_firm ON equipment_usage(firm_id);
CREATE INDEX idx_equipment_usage_equipment ON equipment_usage(equipment_id);
CREATE INDEX idx_equipment_usage_project ON equipment_usage(project_id);
CREATE INDEX idx_equipment_maintenance_firm ON equipment_maintenance(firm_id);
CREATE INDEX idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_scheduled ON equipment_maintenance(scheduled_date);

-- RLS Policies
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Users can view equipment in their firm"
  ON equipment FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage equipment"
  ON equipment FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Equipment usage policies
CREATE POLICY "Users can view usage in their firm"
  ON equipment_usage FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage usage"
  ON equipment_usage FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Equipment maintenance policies
CREATE POLICY "Users can view maintenance in their firm"
  ON equipment_maintenance FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage maintenance"
  ON equipment_maintenance FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_maintenance;

-- Function to update equipment status when usage starts
CREATE OR REPLACE FUNCTION update_equipment_status_on_usage_start()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NULL THEN
    UPDATE equipment
    SET status = 'in_use',
        current_project_id = NEW.project_id,
        updated_at = now()
    WHERE id = NEW.equipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_equipment_usage_start
AFTER INSERT ON equipment_usage
FOR EACH ROW
EXECUTE FUNCTION update_equipment_status_on_usage_start();

-- Function to update equipment status when usage ends
CREATE OR REPLACE FUNCTION update_equipment_status_on_usage_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    UPDATE equipment
    SET status = 'available',
        updated_at = now()
    WHERE id = NEW.equipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_equipment_usage_end
AFTER UPDATE OF end_time ON equipment_usage
FOR EACH ROW
EXECUTE FUNCTION update_equipment_status_on_usage_end();