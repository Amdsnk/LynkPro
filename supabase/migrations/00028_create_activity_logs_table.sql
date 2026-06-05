-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'client', 'invoice', 'proposal', 'report', 'user', 'firm')),
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'sent', 'paid', 'accepted', 'rejected', 'archived')),
  entity_name TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_firm_id ON activity_logs(firm_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view activity logs for their firm"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert activity logs for their firm"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Helper function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_firm_id UUID,
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    firm_id,
    user_id,
    entity_type,
    entity_id,
    action,
    entity_name,
    changes
  ) VALUES (
    p_firm_id,
    p_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_entity_name,
    p_changes
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;