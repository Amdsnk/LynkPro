-- Add demo data for safety incidents and time entries

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  field_user_id uuid;
  pm_user_id uuid;
  safety_user_id uuid;
BEGIN
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO safety_user_id FROM profiles WHERE email = 'safety@lynkpro.com' LIMIT 1;

  IF field_user_id IS NOT NULL THEN

    -- SAFETY INCIDENTS (using correct enum values)
    INSERT INTO safety_incidents (id, firm_id, project_id, incident_number, incident_type, severity, incident_date, location, description, immediate_action, reported_by, investigation_status)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'INC-2026-001', 'near_miss', 'low', NOW() - INTERVAL '15 days', 'Site A - Level 3 Scaffolding', 'Worker nearly struck by falling tool from scaffolding. Tool tether was not properly secured.', 'Conducted immediate safety briefing on tool tethering. Inspected all tools on elevated work areas.', field_user_id, 'closed'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'INC-2026-002', 'injury', 'medium', NOW() - INTERVAL '8 days', 'Site A - Steel Fabrication Area', 'Worker sustained minor cut on hand while handling steel rebar. First aid administered on site. No stitches required.', 'First aid provided immediately. Worker returned to work same day with modified duties.', field_user_id, 'in_progress'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'INC-2026-003', 'property_damage', 'low', NOW() - INTERVAL '5 days', 'Floor 8 - East Wing', 'Scissor lift made contact with wall during operation. Minor damage to lift guard and wall surface.', 'Equipment taken out of service for inspection. Wall repair scheduled.', field_user_id, 'in_progress'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'INC-2026-004', 'near_miss', 'high', NOW() - INTERVAL '3 days', 'Floor 10 - Mechanical Room', 'Electrical wire nearly contacted water source during installation. Immediate corrective action taken.', 'Work stopped immediately. Area secured. Electrical contractor notified.', field_user_id, 'pending'),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'INC-2026-005', 'near_miss', 'medium', NOW() - INTERVAL '2 days', 'Roof Level', 'Worker observed without proper fall protection at height. Verbal warning issued and documented.', 'Worker removed from elevated work. Retrained on fall protection requirements.', safety_user_id, 'pending'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'INC-2026-006', 'environmental', 'low', NOW() - INTERVAL '10 days', 'Site A - Perimeter', 'Minor fuel spill from generator. Approximately 2 gallons diesel fuel.', 'Spill contained immediately with absorbent materials. Area cleaned per environmental protocols.', field_user_id, 'closed'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'INC-2026-007', 'near_miss', 'medium', NOW() - INTERVAL '6 days', 'Floor 5 - Stairwell', 'Temporary handrail found loose during inspection. Could have led to fall.', 'Handrail secured immediately. All temporary railings inspected.', safety_user_id, 'completed')
    ON CONFLICT DO NOTHING;

    -- TIME ENTRIES
    INSERT INTO time_entries (id, firm_id, user_id, project_id, description, start_time, end_time, duration_minutes, is_billable, hourly_rate)
    VALUES
      -- Field worker entries
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_1, 'Foundation formwork installation', (CURRENT_DATE - 5)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 5)::timestamp + INTERVAL '15 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_1, 'Concrete pouring and finishing', (CURRENT_DATE - 4)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 4)::timestamp + INTERVAL '15 hours 30 minutes', 510, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_1, 'Rebar placement and inspection', (CURRENT_DATE - 3)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 3)::timestamp + INTERVAL '14 hours 30 minutes', 450, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_1, 'Steel framing installation', (CURRENT_DATE - 2)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 2)::timestamp + INTERVAL '15 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_1, 'Site cleanup and material organization', (CURRENT_DATE - 1)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 1)::timestamp + INTERVAL '15 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_2, 'Drywall installation - Floor 8', (CURRENT_DATE - 5)::timestamp + INTERVAL '8 hours', (CURRENT_DATE - 5)::timestamp + INTERVAL '16 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_2, 'Electrical rough-in inspection', (CURRENT_DATE - 4)::timestamp + INTERVAL '8 hours', (CURRENT_DATE - 4)::timestamp + INTERVAL '16 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_2, 'HVAC ductwork installation', (CURRENT_DATE - 3)::timestamp + INTERVAL '8 hours', (CURRENT_DATE - 3)::timestamp + INTERVAL '15 hours', 420, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_3, 'Roofing underlayment installation', (CURRENT_DATE - 2)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 2)::timestamp + INTERVAL '15 hours', 480, true, 75.00),
      (gen_random_uuid(), demo_firm_id, field_user_id, demo_project_3, 'Shingle installation', (CURRENT_DATE - 1)::timestamp + INTERVAL '7 hours', (CURRENT_DATE - 1)::timestamp + INTERVAL '14 hours 30 minutes', 450, true, 75.00),
      -- PM entries
      (gen_random_uuid(), demo_firm_id, pm_user_id, demo_project_1, 'Project coordination and planning', (CURRENT_DATE - 5)::timestamp + INTERVAL '8 hours', (CURRENT_DATE - 5)::timestamp + INTERVAL '17 hours', 540, true, 125.00),
      (gen_random_uuid(), demo_firm_id, pm_user_id, demo_project_2, 'Client meeting and progress review', (CURRENT_DATE - 3)::timestamp + INTERVAL '9 hours', (CURRENT_DATE - 3)::timestamp + INTERVAL '12 hours', 180, true, 125.00),
      (gen_random_uuid(), demo_firm_id, pm_user_id, demo_project_1, 'Budget review and variance analysis', (CURRENT_DATE - 4)::timestamp + INTERVAL '8 hours', (CURRENT_DATE - 4)::timestamp + INTERVAL '12 hours', 240, true, 125.00),
      (gen_random_uuid(), demo_firm_id, pm_user_id, demo_project_3, 'Subcontractor coordination', (CURRENT_DATE - 2)::timestamp + INTERVAL '9 hours', (CURRENT_DATE - 2)::timestamp + INTERVAL '13 hours', 240, true, 125.00),
      (gen_random_uuid(), demo_firm_id, pm_user_id, demo_project_2, 'Change order review and approval', (CURRENT_DATE - 1)::timestamp + INTERVAL '10 hours', (CURRENT_DATE - 1)::timestamp + INTERVAL '14 hours', 240, true, 125.00)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;