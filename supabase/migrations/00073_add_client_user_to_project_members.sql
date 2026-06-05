-- Add client user as member of their projects

DO $$
DECLARE
  client_user_id uuid;
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020'; -- Riverside
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000022'; -- Shopping Center
BEGIN
  -- Get client user ID
  SELECT id INTO client_user_id FROM profiles WHERE email = 'client@lynkpro.com' LIMIT 1;

  IF client_user_id IS NOT NULL THEN
    -- Add client as member of Riverside Luxury Apartments
    INSERT INTO project_members (id, project_id, user_id, created_at)
    VALUES (gen_random_uuid(), demo_project_1, client_user_id, NOW())
    ON CONFLICT DO NOTHING;

    -- Add client as member of Suburban Shopping Center
    INSERT INTO project_members (id, project_id, user_id, created_at)
    VALUES (gen_random_uuid(), demo_project_2, client_user_id, NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;