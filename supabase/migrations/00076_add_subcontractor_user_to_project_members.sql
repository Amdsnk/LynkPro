-- Add subcontractor user as member of projects

DO $$
DECLARE
  subcontractor_user_id uuid := '72198c74-facd-4544-9bce-8e1f994e4a56';
  downtown_project uuid := '00000000-0000-0000-0000-000000000021'; -- Downtown Office Tower
  shopping_center_project uuid := '00000000-0000-0000-0000-000000000022'; -- Shopping Center
BEGIN
  -- Add subcontractor as member of Downtown Office Tower Renovation
  INSERT INTO project_members (id, project_id, user_id, created_at)
  VALUES (gen_random_uuid(), downtown_project, subcontractor_user_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Add subcontractor as member of Suburban Shopping Center
  INSERT INTO project_members (id, project_id, user_id, created_at)
  VALUES (gen_random_uuid(), shopping_center_project, subcontractor_user_id, NOW())
  ON CONFLICT DO NOTHING;
END $$;