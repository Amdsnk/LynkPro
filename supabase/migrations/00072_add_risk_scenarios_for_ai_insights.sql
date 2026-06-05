-- Add risk scenarios to trigger AI insights and recommendations

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  pm_user_id uuid;
  field_user_id uuid;
BEGIN
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;

  IF pm_user_id IS NOT NULL THEN

    -- Add overdue and cancelled tasks to create risk scenarios
    INSERT INTO tasks (id, firm_id, project_id, title, description, status, priority, due_date, assigned_to, created_by)
    VALUES
      -- Project 1: Some overdue tasks
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Complete structural inspection', 'Final structural inspection before next phase', 'todo', 'high', CURRENT_DATE - 5, field_user_id, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Submit permit application', 'Submit electrical permit to city', 'todo', 'high', CURRENT_DATE - 3, pm_user_id, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Order HVAC equipment', 'Place order for HVAC units', 'cancelled', 'medium', CURRENT_DATE + 10, pm_user_id, pm_user_id),
      
      -- Project 2: More overdue tasks
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Fix plumbing issues', 'Address plumbing problems found in inspection', 'in_progress', 'high', CURRENT_DATE - 7, field_user_id, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Update project schedule', 'Revise timeline due to delays', 'todo', 'high', CURRENT_DATE - 2, pm_user_id, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Client approval meeting', 'Get client sign-off on changes', 'cancelled', 'medium', CURRENT_DATE - 1, pm_user_id, pm_user_id),
      
      -- Project 3: Some overdue tasks
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Site safety audit', 'Conduct monthly safety inspection', 'todo', 'high', CURRENT_DATE - 4, field_user_id, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Material delivery coordination', 'Coordinate steel delivery schedule', 'in_progress', 'medium', CURRENT_DATE - 1, pm_user_id, pm_user_id)
    ON CONFLICT DO NOTHING;

    -- Update some existing invoices to be overdue
    UPDATE invoices
    SET due_date = CURRENT_DATE - 5
    WHERE firm_id = demo_firm_id
    AND status = 'sent'
    AND invoice_number = 'INV-2026-002';

    UPDATE invoices
    SET due_date = CURRENT_DATE - 2
    WHERE firm_id = demo_firm_id
    AND status = 'sent'
    AND invoice_number = 'INV-2026-003';

    -- Update one invoice to be due soon (for follow-up recommendations)
    UPDATE invoices
    SET due_date = CURRENT_DATE + 2
    WHERE firm_id = demo_firm_id
    AND status = 'sent'
    AND invoice_number = 'INV-2026-004';

  END IF;
END $$;