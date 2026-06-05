-- Insert comprehensive dummy data (clients, projects, proposals, invoices)
DO $$
DECLARE
  v_firm_id UUID;
  v_user_id UUID;
  v_client_1 UUID; v_client_2 UUID; v_client_3 UUID; v_client_4 UUID; v_client_5 UUID;
  v_client_6 UUID; v_client_7 UUID; v_client_8 UUID; v_client_9 UUID; v_client_10 UUID;
  v_project_1 UUID; v_project_2 UUID; v_project_3 UUID; v_project_4 UUID; v_project_5 UUID;
  v_project_6 UUID; v_project_7 UUID; v_project_8 UUID; v_project_9 UUID; v_project_10 UUID;
BEGIN
  SELECT id INTO v_firm_id FROM firms LIMIT 1;
  SELECT id INTO v_user_id FROM profiles WHERE firm_id = v_firm_id LIMIT 1;

  IF v_firm_id IS NULL OR v_user_id IS NULL THEN
    RAISE NOTICE 'No firm or user found';
    RETURN;
  END IF;

  -- Clients
  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Acme Corporation', 'contact@acmecorp.com', '+1-555-0101', '123 Business Ave, New York, NY', v_user_id, NOW() - INTERVAL '90 days', NOW())
  RETURNING id INTO v_client_1;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'TechStart Inc', 'hello@techstart.io', '+1-555-0102', '456 Innovation Dr, San Francisco, CA', v_user_id, NOW() - INTERVAL '75 days', NOW())
  RETURNING id INTO v_client_2;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Global Ventures LLC', 'info@globalventures.com', '+1-555-0103', '789 Enterprise Blvd, Chicago, IL', v_user_id, NOW() - INTERVAL '60 days', NOW())
  RETURNING id INTO v_client_3;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'BuildRight Construction', 'projects@buildright.com', '+1-555-0104', '321 Construction Way, Austin, TX', v_user_id, NOW() - INTERVAL '45 days', NOW())
  RETURNING id INTO v_client_4;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Urban Design Studio', 'studio@urbandesign.com', '+1-555-0105', '654 Creative Lane, Seattle, WA', v_user_id, NOW() - INTERVAL '30 days', NOW())
  RETURNING id INTO v_client_5;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Metro Properties', 'contact@metroproperties.com', '+1-555-0106', '987 Real Estate Plaza, Boston, MA', v_user_id, NOW() - INTERVAL '20 days', NOW())
  RETURNING id INTO v_client_6;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Skyline Developers', 'info@skylinedev.com', '+1-555-0107', '147 Tower Street, Miami, FL', v_user_id, NOW() - INTERVAL '15 days', NOW())
  RETURNING id INTO v_client_7;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Heritage Restoration', 'heritage@restoration.com', '+1-555-0108', '258 Historic Ave, Philadelphia, PA', v_user_id, NOW() - INTERVAL '10 days', NOW())
  RETURNING id INTO v_client_8;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Modern Living Spaces', 'hello@modernliving.com', '+1-555-0109', '369 Contemporary Rd, Denver, CO', v_user_id, NOW() - INTERVAL '5 days', NOW())
  RETURNING id INTO v_client_9;

  INSERT INTO clients (id, firm_id, name, email, phone, address, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, 'Coastal Architecture', 'contact@coastalarch.com', '+1-555-0110', '741 Beachfront Dr, San Diego, CA', v_user_id, NOW() - INTERVAL '2 days', NOW())
  RETURNING id INTO v_client_10;

  -- Projects
  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_1, 'Downtown Office Complex', 'Modern 15-story office building', 'active', 'Weekly meetings scheduled', v_user_id, NOW() - INTERVAL '80 days', NOW())
  RETURNING id INTO v_project_1;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_2, 'Tech Campus Phase 1', 'Tech campus main building', 'active', 'Fast-track schedule', v_user_id, NOW() - INTERVAL '70 days', NOW())
  RETURNING id INTO v_project_2;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_3, 'Retail Plaza Renovation', 'Complete retail renovation', 'on_hold', 'Waiting for permits', v_user_id, NOW() - INTERVAL '55 days', NOW())
  RETURNING id INTO v_project_3;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_4, 'Residential Tower Phase 2', '30-story residential tower', 'active', 'CD 80% complete', v_user_id, NOW() - INTERVAL '40 days', NOW())
  RETURNING id INTO v_project_4;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_5, 'Urban Park Master Plan', '50-acre urban park', 'active', 'Community engagement ongoing', v_user_id, NOW() - INTERVAL '25 days', NOW())
  RETURNING id INTO v_project_5;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_6, 'Historic Building Reuse', 'Warehouse to office conversion', 'completed', 'Project completed', v_user_id, NOW() - INTERVAL '180 days', NOW())
  RETURNING id INTO v_project_6;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_7, 'Luxury Condominiums', 'High-end residential', 'active', 'SD approved', v_user_id, NOW() - INTERVAL '12 days', NOW())
  RETURNING id INTO v_project_7;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_8, 'Museum Expansion', 'Museum addition', 'on_hold', 'Fundraising in progress', v_user_id, NOW() - INTERVAL '90 days', NOW())
  RETURNING id INTO v_project_8;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_9, 'Sustainable Housing', 'Net-zero community', 'active', 'Innovative design', v_user_id, NOW() - INTERVAL '4 days', NOW())
  RETURNING id INTO v_project_9;

  INSERT INTO projects (id, firm_id, client_id, name, description, status, internal_notes, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), v_firm_id, v_client_10, 'Waterfront Development', 'Mixed-use waterfront', 'active', 'Multiple stakeholders', v_user_id, NOW() - INTERVAL '1 day', NOW())
  RETURNING id INTO v_project_10;

  -- Proposals
  INSERT INTO proposals (firm_id, client_id, project_id, title, content, total_amount, status, sent_at, created_by, created_at, updated_at)
  VALUES
    (v_firm_id, v_client_1, v_project_1, 'Architectural Services - Downtown Office', '{"description": "Complete architectural services"}', 285000.00, 'accepted', NOW() - INTERVAL '75 days', v_user_id, NOW() - INTERVAL '80 days', NOW()),
    (v_firm_id, v_client_2, v_project_2, 'Tech Campus Design Services', '{"description": "Master planning and design"}', 425000.00, 'accepted', NOW() - INTERVAL '65 days', v_user_id, NOW() - INTERVAL '70 days', NOW()),
    (v_firm_id, v_client_3, v_project_3, 'Retail Plaza Renovation Design', '{"description": "Renovation design services"}', 125000.00, 'sent', NOW() - INTERVAL '50 days', v_user_id, NOW() - INTERVAL '55 days', NOW()),
    (v_firm_id, v_client_4, v_project_4, 'Residential Tower Full Services', '{"description": "Complete architectural services"}', 550000.00, 'accepted', NOW() - INTERVAL '35 days', v_user_id, NOW() - INTERVAL '40 days', NOW()),
    (v_firm_id, v_client_5, v_project_5, 'Urban Park Master Planning', '{"description": "Master planning services"}', 175000.00, 'accepted', NOW() - INTERVAL '20 days', v_user_id, NOW() - INTERVAL '25 days', NOW()),
    (v_firm_id, v_client_7, v_project_7, 'Luxury Condominium Design', '{"description": "Architectural design services"}', 380000.00, 'sent', NOW() - INTERVAL '10 days', v_user_id, NOW() - INTERVAL '12 days', NOW()),
    (v_firm_id, v_client_9, v_project_9, 'Sustainable Housing Design', '{"description": "Net-zero design services"}', 295000.00, 'draft', NULL, v_user_id, NOW() - INTERVAL '3 days', NOW()),
    (v_firm_id, v_client_10, v_project_10, 'Waterfront Conceptual Design', '{"description": "Conceptual design study"}', 150000.00, 'draft', NULL, v_user_id, NOW() - INTERVAL '1 day', NOW()),
    (v_firm_id, v_client_8, v_project_8, 'Museum Feasibility Study', '{"description": "Feasibility study"}', 45000.00, 'rejected', NOW() - INTERVAL '85 days', v_user_id, NOW() - INTERVAL '90 days', NOW()),
    (v_firm_id, v_client_6, v_project_6, 'Additional Interior Services', '{"description": "Interior design services"}', 75000.00, 'accepted', NOW() - INTERVAL '25 days', v_user_id, NOW() - INTERVAL '30 days', NOW());

  -- Invoices
  INSERT INTO invoices (firm_id, client_id, project_id, invoice_number, title, description, total_amount, paid_amount, status, issue_date, due_date, sent_at, paid_at, notes, created_by, created_at, updated_at)
  VALUES
    (v_firm_id, v_client_1, v_project_1, 'INV-2026-001', 'Schematic Design Phase', 'SD phase payment', 85500.00, 85500.00, 'paid', (NOW() - INTERVAL '60 days')::date, (NOW() - INTERVAL '30 days')::date, NOW() - INTERVAL '60 days', NOW() - INTERVAL '25 days', 'Payment received', v_user_id, NOW() - INTERVAL '65 days', NOW()),
    (v_firm_id, v_client_2, v_project_2, 'INV-2026-002', 'Design Development Phase', 'DD deliverables', 127500.00, 127500.00, 'paid', (NOW() - INTERVAL '45 days')::date, (NOW() - INTERVAL '15 days')::date, NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days', 'Payment received', v_user_id, NOW() - INTERVAL '50 days', NOW()),
    (v_firm_id, v_client_4, v_project_4, 'INV-2026-003', 'Construction Documents', '50% CD completion', 165000.00, 165000.00, 'paid', (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '1 day')::date, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 'Payment received', v_user_id, NOW() - INTERVAL '35 days', NOW()),
    (v_firm_id, v_client_5, v_project_5, 'INV-2026-004', 'Master Planning Phase 1', 'Initial phase', 52500.00, 0.00, 'sent', (NOW() - INTERVAL '20 days')::date, (NOW() + INTERVAL '10 days')::date, NOW() - INTERVAL '20 days', NULL, 'Awaiting payment', v_user_id, NOW() - INTERVAL '25 days', NOW()),
    (v_firm_id, v_client_1, v_project_1, 'INV-2026-005', 'Design Development', 'DD completion', 95000.00, 0.00, 'sent', (NOW() - INTERVAL '15 days')::date, (NOW() + INTERVAL '15 days')::date, NOW() - INTERVAL '15 days', NULL, 'Invoice sent', v_user_id, NOW() - INTERVAL '20 days', NOW()),
    (v_firm_id, v_client_6, v_project_6, 'INV-2026-006', 'Final Payment', 'Project completion', 45000.00, 45000.00, 'paid', (NOW() - INTERVAL '35 days')::date, (NOW() - INTERVAL '5 days')::date, NOW() - INTERVAL '35 days', NOW() - INTERVAL '3 days', 'Completed', v_user_id, NOW() - INTERVAL '40 days', NOW()),
    (v_firm_id, v_client_7, v_project_7, 'INV-2026-007', 'Schematic Design', 'SD phase', 114000.00, 0.00, 'sent', (NOW() - INTERVAL '10 days')::date, (NOW() + INTERVAL '20 days')::date, NOW() - INTERVAL '10 days', NULL, 'Sent for review', v_user_id, NOW() - INTERVAL '12 days', NOW()),
    (v_firm_id, v_client_2, v_project_2, 'INV-2026-008', 'Construction Documents', '75% CD', 191250.00, 0.00, 'overdue', (NOW() - INTERVAL '40 days')::date, (NOW() - INTERVAL '10 days')::date, NOW() - INTERVAL '40 days', NULL, 'Overdue - follow up', v_user_id, NOW() - INTERVAL '45 days', NOW()),
    (v_firm_id, v_client_9, v_project_9, 'INV-2026-009', 'Initial Design Services', 'First payment', 88500.00, 0.00, 'draft', (NOW() - INTERVAL '2 days')::date, (NOW() + INTERVAL '28 days')::date, NULL, NULL, 'Draft pending', v_user_id, NOW() - INTERVAL '3 days', NOW()),
    (v_firm_id, v_client_4, v_project_4, 'INV-2026-010', 'Additional Services', 'Design revisions', 35000.00, 0.00, 'overdue', (NOW() - INTERVAL '50 days')::date, (NOW() - INTERVAL '20 days')::date, NOW() - INTERVAL '50 days', NULL, 'Escalate to management', v_user_id, NOW() - INTERVAL '55 days', NOW()),
    (v_firm_id, v_client_10, v_project_10, 'INV-2026-011', 'Conceptual Design', 'Initial payment', 45000.00, 0.00, 'draft', NOW()::date, (NOW() + INTERVAL '30 days')::date, NULL, NULL, 'New project', v_user_id, NOW() - INTERVAL '1 day', NOW()),
    (v_firm_id, v_client_5, v_project_5, 'INV-2026-012', 'Master Planning Phase 2', 'Second phase', 61250.00, 0.00, 'sent', (NOW() - INTERVAL '5 days')::date, (NOW() + INTERVAL '25 days')::date, NOW() - INTERVAL '5 days', NULL, 'Recently sent', v_user_id, NOW() - INTERVAL '7 days', NOW());

  RAISE NOTICE 'Successfully inserted dummy data: 10 clients, 10 projects, 10 proposals, 12 invoices';
END $$;