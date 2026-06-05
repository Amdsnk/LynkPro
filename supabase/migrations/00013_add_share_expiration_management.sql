-- Add auto_renew and expiration_duration to file_shares
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false;
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS expiration_duration integer;

-- Function to extend share expiration
CREATE OR REPLACE FUNCTION extend_share_expiration(
  share_id_param uuid,
  days_param integer
)
RETURNS timestamptz AS $$
DECLARE
  new_expiration timestamptz;
BEGIN
  -- Calculate new expiration date
  new_expiration := now() + (days_param || ' days')::interval;
  
  -- Update share
  UPDATE file_shares
  SET expires_at = new_expiration,
      updated_at = now()
  WHERE id = share_id_param;
  
  RETURN new_expiration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-renew share on access
CREATE OR REPLACE FUNCTION auto_renew_share(share_id_param uuid)
RETURNS void AS $$
DECLARE
  share_record RECORD;
  new_expiration timestamptz;
BEGIN
  -- Get share details
  SELECT * INTO share_record
  FROM file_shares
  WHERE id = share_id_param;
  
  -- Check if auto-renew is enabled and has duration
  IF share_record.auto_renew AND share_record.expiration_duration IS NOT NULL THEN
    -- Calculate new expiration from now
    new_expiration := now() + (share_record.expiration_duration || ' days')::interval;
    
    -- Update expiration
    UPDATE file_shares
    SET expires_at = new_expiration,
        updated_at = now()
    WHERE id = share_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk extend shares
CREATE OR REPLACE FUNCTION bulk_extend_shares(
  share_ids_param uuid[],
  days_param integer
)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Calculate new expiration date
  UPDATE file_shares
  SET expires_at = now() + (days_param || ' days')::interval,
      updated_at = now()
  WHERE id = ANY(share_ids_param);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
