-- Safety Incident System
CREATE TYPE incident_type AS ENUM ('injury', 'near_miss', 'property_damage', 'environmental', 'security');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE investigation_status AS ENUM ('pending', 'in_progress', 'completed', 'closed');

-- Safety incidents table
CREATE TABLE safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  incident_number text UNIQUE NOT NULL,
  incident_type incident_type NOT NULL,
  severity incident_severity NOT NULL,
  incident_date timestamptz NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  immediate_action text,
  photos text[] DEFAULT '{}',
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  investigation_status investigation_status NOT NULL DEFAULT 'pending',
  assigned_investigator uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Incident investigations table
CREATE TABLE incident_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
  investigator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  root_cause text,
  contributing_factors text,
  findings text NOT NULL,
  investigation_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Corrective actions table
CREATE TABLE corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
  action_description text NOT NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  completed_date date,
  is_completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_safety_incidents_firm ON safety_incidents(firm_id);
CREATE INDEX idx_safety_incidents_project ON safety_incidents(project_id);
CREATE INDEX idx_safety_incidents_severity ON safety_incidents(severity);
CREATE INDEX idx_safety_incidents_status ON safety_incidents(investigation_status);
CREATE INDEX idx_safety_incidents_date ON safety_incidents(incident_date);
CREATE INDEX idx_incident_investigations_firm ON incident_investigations(firm_id);
CREATE INDEX idx_incident_investigations_incident ON incident_investigations(incident_id);
CREATE INDEX idx_corrective_actions_firm ON corrective_actions(firm_id);
CREATE INDEX idx_corrective_actions_incident ON corrective_actions(incident_id);
CREATE INDEX idx_corrective_actions_assigned ON corrective_actions(assigned_to);

-- RLS Policies
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;

-- Safety incidents policies
CREATE POLICY "Users can view incidents in their firm"
  ON safety_incidents FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage incidents"
  ON safety_incidents FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Incident investigations policies
CREATE POLICY "Users can view investigations in their firm"
  ON incident_investigations FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage investigations"
  ON incident_investigations FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Corrective actions policies
CREATE POLICY "Users can view corrective actions in their firm"
  ON corrective_actions FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can manage corrective actions"
  ON corrective_actions FOR ALL
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')))
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE safety_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE incident_investigations;
ALTER PUBLICATION supabase_realtime ADD TABLE corrective_actions;

-- Function to generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part text;
  sequence_num text;
  next_num integer;
BEGIN
  year_part := TO_CHAR(NEW.incident_date, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM safety_incidents
  WHERE firm_id = NEW.firm_id
    AND incident_number LIKE 'INC-' || year_part || '-%';
  
  sequence_num := LPAD(next_num::text, 4, '0');
  NEW.incident_number := 'INC-' || year_part || '-' || sequence_num;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_generate_incident_number
BEFORE INSERT ON safety_incidents
FOR EACH ROW
WHEN (NEW.incident_number IS NULL OR NEW.incident_number = '')
EXECUTE FUNCTION generate_incident_number();