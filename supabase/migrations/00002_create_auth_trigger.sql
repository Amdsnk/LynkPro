-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_firm_id uuid;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- If this is the first user, create a firm and make them admin
  IF user_count = 0 THEN
    INSERT INTO firms (name, email) 
    VALUES ('My Firm', NEW.email) 
    RETURNING id INTO new_firm_id;
    
    INSERT INTO profiles (id, email, full_name, role, firm_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'admin'::user_role,
      new_firm_id
    );
  ELSE
    -- For subsequent users, they start as clients without a firm
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'client'::user_role
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user confirmation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();