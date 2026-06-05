-- Add activity logs for Command Center dashboard (using only allowed entity types)

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  admin_user_id uuid;
  pm_user_id uuid;
  field_user_id uuid;
  safety_user_id uuid;
  client_user_id uuid;
  invoice_1_id uuid;
  invoice_2_id uuid;
  proposal_1_id uuid;
  proposal_2_id uuid;
  report_1_id uuid;
  report_2_id uuid;
  client_1_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@lynkpro.com' LIMIT 1;
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;
  SELECT id INTO safety_user_id FROM profiles WHERE email = 'safety@lynkpro.com' LIMIT 1;
  SELECT id INTO client_user_id FROM profiles WHERE email = 'client@lynkpro.com' LIMIT 1;

  -- Get entity IDs
  SELECT id INTO invoice_1_id FROM invoices WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO invoice_2_id FROM invoices WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO proposal_1_id FROM proposals WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO proposal_2_id FROM proposals WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO report_1_id FROM reports WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO report_2_id FROM reports WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO client_1_id FROM clients WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;

  IF admin_user_id IS NOT NULL THEN

    -- Recent activity logs (last 7 days) - only using allowed entity types
    INSERT INTO activity_logs (id, firm_id, user_id, action, entity_type, entity_id, entity_name, changes, created_at)
    VALUES
      -- Today
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'updated', 'project', demo_project_1, 'Riverside Luxury Apartments', '{"field": "timeline", "description": "Updated project milestones"}'::jsonb, NOW() - INTERVAL '2 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', report_1_id, 'Daily Site Report', '{"photos": 3, "description": "Progress update with photos"}'::jsonb, NOW() - INTERVAL '3 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'sent', 'invoice', invoice_1_id, 'Invoice #INV-2026-001', '{"amount": 425000, "description": "Sent to client"}'::jsonb, NOW() - INTERVAL '4 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'accepted', 'proposal', proposal_1_id, 'Riverside Apartments Proposal', '{"value": 2850000, "description": "Client accepted proposal"}'::jsonb, NOW() - INTERVAL '5 hours'),
      (gen_random_uuid(), demo_firm_id, client_user_id, 'updated', 'client', client_1_id, 'Riverside Development LLC', '{"field": "contact", "description": "Updated contact information"}'::jsonb, NOW() - INTERVAL '6 hours'),
      
      -- Yesterday
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', report_2_id, 'Daily Site Report', '{"photos": 5, "description": "Foundation work complete"}'::jsonb, NOW() - INTERVAL '1 day' - INTERVAL '2 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'updated', 'project', demo_project_2, 'Office Tower Renovation', '{"field": "budget", "description": "Budget adjustment approved"}'::jsonb, NOW() - INTERVAL '1 day' - INTERVAL '4 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'paid', 'invoice', invoice_2_id, 'Invoice #INV-2026-002', '{"amount": 385000, "description": "Payment received"}'::jsonb, NOW() - INTERVAL '1 day' - INTERVAL '6 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'sent', 'proposal', proposal_2_id, 'Shopping Center Proposal', '{"value": 3250000, "description": "Sent to client"}'::jsonb, NOW() - INTERVAL '1 day' - INTERVAL '8 hours'),
      
      -- 2 days ago
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'created', 'invoice', invoice_1_id, 'Invoice #INV-2026-003', '{"amount": 425000, "description": "Milestone billing"}'::jsonb, NOW() - INTERVAL '2 days' - INTERVAL '3 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'updated', 'report', report_1_id, 'Daily Site Report', '{"field": "status", "description": "Added safety notes"}'::jsonb, NOW() - INTERVAL '2 days' - INTERVAL '5 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'updated', 'project', demo_project_1, 'Riverside Luxury Apartments', '{"field": "status", "description": "Phase 1 milestone reached"}'::jsonb, NOW() - INTERVAL '2 days' - INTERVAL '7 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'created', 'proposal', proposal_1_id, 'Phase 2 Proposal', '{"value": 1500000, "description": "Next phase proposal"}'::jsonb, NOW() - INTERVAL '2 days' - INTERVAL '9 hours'),
      
      -- 3 days ago
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'updated', 'project', demo_project_3, 'Suburban Shopping Center', '{"field": "status", "description": "Project activated"}'::jsonb, NOW() - INTERVAL '3 days' - INTERVAL '4 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', NULL, 'Weekly Progress Report', '{"description": "Week 12 summary"}'::jsonb, NOW() - INTERVAL '3 days' - INTERVAL '6 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'updated', 'client', client_1_id, 'Riverside Development LLC', '{"field": "billing", "description": "Updated billing address"}'::jsonb, NOW() - INTERVAL '3 days' - INTERVAL '8 hours'),
      
      -- 4 days ago
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'created', 'project', demo_project_3, 'Suburban Shopping Center', '{"budget": 3250000, "description": "New project initiated"}'::jsonb, NOW() - INTERVAL '4 days' - INTERVAL '5 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'sent', 'proposal', NULL, 'Metro Development Proposal', '{"value": 1850000, "description": "Proposal sent"}'::jsonb, NOW() - INTERVAL '4 days' - INTERVAL '7 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', NULL, 'Inspection Report', '{"description": "Electrical inspection passed"}'::jsonb, NOW() - INTERVAL '4 days' - INTERVAL '9 hours'),
      
      -- 5 days ago
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'updated', 'project', demo_project_1, 'Riverside Luxury Apartments', '{"field": "schedule", "description": "Schedule updated"}'::jsonb, NOW() - INTERVAL '5 days' - INTERVAL '3 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'accepted', 'proposal', NULL, 'Office Tower Proposal', '{"value": 1410000, "description": "Client accepted"}'::jsonb, NOW() - INTERVAL '5 days' - INTERVAL '6 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', NULL, 'Safety Report', '{"description": "Weekly safety audit"}'::jsonb, NOW() - INTERVAL '5 days' - INTERVAL '8 hours'),
      
      -- 6 days ago
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'paid', 'invoice', NULL, 'Invoice #INV-2026-001', '{"amount": 425000, "description": "Wire transfer received"}'::jsonb, NOW() - INTERVAL '6 days' - INTERVAL '4 hours'),
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'updated', 'project', demo_project_2, 'Office Tower Renovation', '{"field": "schedule", "description": "Weather delay adjustment"}'::jsonb, NOW() - INTERVAL '6 days' - INTERVAL '7 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', NULL, 'Quality Report', '{"description": "Concrete strength test passed"}'::jsonb, NOW() - INTERVAL '6 days' - INTERVAL '10 hours'),
      
      -- 7 days ago
      (gen_random_uuid(), demo_firm_id, pm_user_id, 'created', 'invoice', NULL, 'Invoice #INV-2026-004', '{"amount": 275000, "description": "Progress billing"}'::jsonb, NOW() - INTERVAL '7 days' - INTERVAL '3 hours'),
      (gen_random_uuid(), demo_firm_id, field_user_id, 'created', 'report', NULL, 'Progress Photos', '{"photos": 7, "description": "Weekly photo update"}'::jsonb, NOW() - INTERVAL '7 days' - INTERVAL '6 hours'),
      (gen_random_uuid(), demo_firm_id, admin_user_id, 'updated', 'firm', demo_firm_id, 'LynkPro Demo Construction', '{"field": "settings", "description": "Updated company settings"}'::jsonb, NOW() - INTERVAL '7 days' - INTERVAL '9 hours')
    ON CONFLICT DO NOTHING;

  END IF;
END $$;