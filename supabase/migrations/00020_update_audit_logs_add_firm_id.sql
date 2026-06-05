-- Add firm_id to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_audit_logs_firm_id ON audit_logs(firm_id);

-- Update existing records to set firm_id from user's profile
UPDATE audit_logs al
SET firm_id = p.firm_id
FROM profiles p
WHERE al.user_id = p.id AND al.firm_id IS NULL;

-- RLS Policies (drop existing and recreate)
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = audit_logs.firm_id
      AND profiles.role = 'admin'
    )
  );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_firm_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    firm_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    p_firm_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    jsonb_build_object('old', p_old_values, 'new', p_new_values)
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;