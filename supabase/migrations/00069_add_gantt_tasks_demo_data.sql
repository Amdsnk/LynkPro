-- Add Gantt tasks demo data

DO $$
DECLARE
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  pm_user_id uuid;
  field_user_id uuid;
BEGIN
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;

  IF pm_user_id IS NOT NULL THEN
    INSERT INTO gantt_tasks (id, project_id, name, description, start_date, end_date, progress, assignee_id, status, priority, is_milestone)
    VALUES
      (gen_random_uuid(), demo_project_1, 'Site Preparation', 'Clear site and prepare for construction', CURRENT_DATE - 60, CURRENT_DATE - 45, 100, pm_user_id, 'completed', 'high', false),
      (gen_random_uuid(), demo_project_1, 'Foundation Work', 'Excavation, footings, and foundation walls', CURRENT_DATE - 45, CURRENT_DATE - 20, 100, field_user_id, 'completed', 'high', true),
      (gen_random_uuid(), demo_project_1, 'Structural Framing', 'Steel and concrete structural system', CURRENT_DATE - 20, CURRENT_DATE + 15, 65, field_user_id, 'in_progress', 'high', false),
      (gen_random_uuid(), demo_project_1, 'MEP Rough-In', 'Mechanical, electrical, plumbing rough-in', CURRENT_DATE + 10, CURRENT_DATE + 40, 15, pm_user_id, 'not_started', 'high', false),
      (gen_random_uuid(), demo_project_1, 'Exterior Envelope', 'Roofing, siding, windows', CURRENT_DATE + 35, CURRENT_DATE + 70, 0, pm_user_id, 'not_started', 'medium', false),
      (gen_random_uuid(), demo_project_1, 'Interior Finishes', 'Drywall, flooring, paint, fixtures', CURRENT_DATE + 65, CURRENT_DATE + 100, 0, pm_user_id, 'not_started', 'medium', false),
      (gen_random_uuid(), demo_project_2, 'Demolition', 'Interior demolition and prep', CURRENT_DATE - 70, CURRENT_DATE - 55, 100, field_user_id, 'completed', 'high', false),
      (gen_random_uuid(), demo_project_2, 'HVAC Installation', 'New HVAC system installation', CURRENT_DATE - 50, CURRENT_DATE - 10, 100, pm_user_id, 'completed', 'high', true),
      (gen_random_uuid(), demo_project_2, 'Electrical Upgrades', 'Panel upgrades and new wiring', CURRENT_DATE - 30, CURRENT_DATE + 10, 75, pm_user_id, 'in_progress', 'high', false),
      (gen_random_uuid(), demo_project_2, 'Interior Renovation', 'Finishes and fixtures', CURRENT_DATE + 5, CURRENT_DATE + 45, 20, pm_user_id, 'in_progress', 'medium', false),
      (gen_random_uuid(), demo_project_2, 'Final Inspections', 'All final inspections and punch list', CURRENT_DATE + 40, CURRENT_DATE + 55, 0, pm_user_id, 'not_started', 'high', true),
      (gen_random_uuid(), demo_project_3, 'Site Development', 'Grading, utilities, parking lot base', CURRENT_DATE - 40, CURRENT_DATE - 5, 100, field_user_id, 'completed', 'high', true),
      (gen_random_uuid(), demo_project_3, 'Foundation', 'Building foundation and slab', CURRENT_DATE - 10, CURRENT_DATE + 25, 40, field_user_id, 'in_progress', 'high', false),
      (gen_random_uuid(), demo_project_3, 'Structural Steel', 'Steel frame erection', CURRENT_DATE + 20, CURRENT_DATE + 60, 0, pm_user_id, 'not_started', 'high', false),
      (gen_random_uuid(), demo_project_3, 'Building Envelope', 'Exterior walls and roofing', CURRENT_DATE + 55, CURRENT_DATE + 95, 0, pm_user_id, 'not_started', 'medium', false),
      (gen_random_uuid(), demo_project_3, 'Tenant Improvements', 'Interior build-out for tenants', CURRENT_DATE + 90, CURRENT_DATE + 140, 0, pm_user_id, 'not_started', 'low', false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;