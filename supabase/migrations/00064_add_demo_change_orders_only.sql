-- Add demo data for change orders only

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  pm_user_id uuid;
BEGIN
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;

  IF pm_user_id IS NOT NULL THEN

    -- CHANGE ORDERS
    INSERT INTO change_orders (id, firm_id, project_id, co_number, title, description, reason, cost_impact, schedule_impact_days, status, requested_by, request_date)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'CO-001', 'Additional Foundation Reinforcement', 'Client requested additional steel reinforcement in foundation due to soil conditions discovered during excavation.', 'Unforeseen site conditions', 15000.00, 5, 'approved', pm_user_id, CURRENT_DATE - 20),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'CO-002', 'Upgrade to Premium Finishes', 'Client upgrade request for lobby finishes including marble flooring and custom lighting.', 'Client request', 45000.00, 0, 'approved', pm_user_id, CURRENT_DATE - 15),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'CO-001', 'HVAC System Upgrade', 'Building code change requires upgraded HVAC system with improved efficiency ratings.', 'Code change', 32000.00, 10, 'pending', pm_user_id, CURRENT_DATE - 5),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'CO-002', 'Additional Electrical Outlets', 'Tenant requested additional electrical outlets in office spaces.', 'Client request', 8500.00, 3, 'approved', pm_user_id, CURRENT_DATE - 8),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'CO-001', 'Roofing Material Change', 'Client requested upgrade from standard to architectural shingles.', 'Client request', 12000.00, 2, 'pending', pm_user_id, CURRENT_DATE - 3),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'CO-003', 'Additional Parking Spaces', 'City requirement for additional parking spaces based on updated occupancy calculations.', 'Code change', 28000.00, 7, 'approved', pm_user_id, CURRENT_DATE - 12)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;