-- Add client-facing demo data: invoices, proposals, reports, documents

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  admin_user_id uuid;
  pm_user_id uuid;
  client_1_id uuid;
  client_2_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@lynkpro.com' LIMIT 1;
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  
  -- Get client IDs
  SELECT id INTO client_1_id FROM clients WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO client_2_id FROM clients WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;

  IF admin_user_id IS NOT NULL AND client_1_id IS NOT NULL THEN

    -- ============================================
    -- INVOICES (Client Billing)
    -- ============================================
    INSERT INTO invoices (
      id, firm_id, project_id, client_id, invoice_number, title, description,
      line_items, total_amount, status, issue_date, due_date, sent_at, paid_at, paid_amount, created_by
    )
    VALUES
      -- Project 1 Invoices
      (
        gen_random_uuid(), demo_firm_id, demo_project_1, client_1_id, 'INV-2026-001',
        'Riverside Apartments - Progress Payment #1',
        'Foundation and site work completion',
        '[
          {"description": "Site preparation and excavation", "quantity": 1, "unit": "LS", "rate": 125000, "amount": 125000},
          {"description": "Foundation concrete and rebar", "quantity": 1, "unit": "LS", "rate": 285000, "amount": 285000},
          {"description": "Underground utilities installation", "quantity": 1, "unit": "LS", "rate": 95000, "amount": 95000}
        ]'::jsonb,
        505000, 'paid', CURRENT_DATE - 45, CURRENT_DATE - 15, CURRENT_DATE - 45, CURRENT_DATE - 10, 505000, admin_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_1, client_1_id, 'INV-2026-002',
        'Riverside Apartments - Progress Payment #2',
        'Structural framing and first floor completion',
        '[
          {"description": "Structural steel framing", "quantity": 1, "unit": "LS", "rate": 245000, "amount": 245000},
          {"description": "First floor concrete slab", "quantity": 1, "unit": "LS", "rate": 165000, "amount": 165000},
          {"description": "Rough electrical and plumbing", "quantity": 1, "unit": "LS", "rate": 125000, "amount": 125000}
        ]'::jsonb,
        535000, 'sent', CURRENT_DATE - 15, CURRENT_DATE + 15, CURRENT_DATE - 15, NULL, NULL, admin_user_id
      ),
      
      -- Project 2 Invoices
      (
        gen_random_uuid(), demo_firm_id, demo_project_2, client_2_id, 'INV-2026-003',
        'Office Tower - Demolition & Prep',
        'Interior demolition and preparation work',
        '[
          {"description": "Interior demolition", "quantity": 1, "unit": "LS", "rate": 85000, "amount": 85000},
          {"description": "Debris removal and disposal", "quantity": 1, "unit": "LS", "rate": 35000, "amount": 35000},
          {"description": "Temporary protection systems", "quantity": 1, "unit": "LS", "rate": 25000, "amount": 25000}
        ]'::jsonb,
        145000, 'paid', CURRENT_DATE - 60, CURRENT_DATE - 30, CURRENT_DATE - 60, CURRENT_DATE - 25, 145000, pm_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_2, client_2_id, 'INV-2026-004',
        'Office Tower - HVAC & Electrical',
        'New HVAC system and electrical upgrades',
        '[
          {"description": "HVAC system installation", "quantity": 1, "unit": "LS", "rate": 195000, "amount": 195000},
          {"description": "Electrical panel upgrades", "quantity": 1, "unit": "LS", "rate": 75000, "amount": 75000},
          {"description": "LED lighting installation", "quantity": 1, "unit": "LS", "rate": 45000, "amount": 45000}
        ]'::jsonb,
        315000, 'sent', CURRENT_DATE - 10, CURRENT_DATE + 20, CURRENT_DATE - 10, NULL, NULL, pm_user_id
      ),
      
      -- Project 3 Invoices
      (
        gen_random_uuid(), demo_firm_id, demo_project_3, client_1_id, 'INV-2026-005',
        'Shopping Center - Site Development',
        'Initial site development and grading',
        '[
          {"description": "Site clearing and grading", "quantity": 1, "unit": "LS", "rate": 155000, "amount": 155000},
          {"description": "Storm drainage system", "quantity": 1, "unit": "LS", "rate": 125000, "amount": 125000},
          {"description": "Parking lot base preparation", "quantity": 1, "unit": "LS", "rate": 95000, "amount": 95000}
        ]'::jsonb,
        375000, 'paid', CURRENT_DATE - 30, CURRENT_DATE, CURRENT_DATE - 30, CURRENT_DATE - 5, 375000, admin_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_3, client_1_id, 'INV-2026-006',
        'Shopping Center - Foundation Work',
        'Building foundation and structural work',
        '[
          {"description": "Foundation excavation and footings", "quantity": 1, "unit": "LS", "rate": 225000, "amount": 225000},
          {"description": "Foundation walls and waterproofing", "quantity": 1, "unit": "LS", "rate": 185000, "amount": 185000},
          {"description": "Structural steel delivery", "quantity": 1, "unit": "LS", "rate": 145000, "amount": 145000}
        ]'::jsonb,
        555000, 'draft', CURRENT_DATE, CURRENT_DATE + 30, NULL, NULL, NULL, admin_user_id
      )
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- PROPOSALS (Project Proposals)
    -- ============================================
    INSERT INTO proposals (
      id, firm_id, project_id, client_id, title, content, line_items, total_amount, status, sent_at, created_by
    )
    VALUES
      -- Accepted Proposals (for existing projects)
      (
        gen_random_uuid(), demo_firm_id, demo_project_1, client_1_id,
        'Riverside Apartments Construction Proposal',
        '{"introduction": "LynkPro Demo Construction is pleased to submit this proposal for the construction of Riverside Apartments, a modern 48-unit residential complex.", "scope": "Complete construction including foundation, structural framing, MEP systems, interior finishes, and site work.", "timeline": "18 months from notice to proceed", "warranty": "1-year warranty on all workmanship and materials"}'::jsonb,
        '[
          {"phase": "Site Work & Foundation", "description": "Site preparation, excavation, and foundation construction", "amount": 650000},
          {"phase": "Structural Framing", "description": "Steel and concrete structural system", "amount": 850000},
          {"phase": "MEP Systems", "description": "Mechanical, electrical, and plumbing installation", "amount": 550000},
          {"phase": "Interior Finishes", "description": "Drywall, flooring, painting, and fixtures", "amount": 350000},
          {"phase": "Exterior & Site", "description": "Roofing, siding, landscaping, and parking", "amount": 250000}
        ]'::jsonb,
        2650000, 'accepted', CURRENT_DATE - 120, admin_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_2, client_2_id,
        'Office Tower Renovation Proposal',
        '{"introduction": "Comprehensive renovation proposal for modernizing the existing 5-story office building.", "scope": "Interior demolition, HVAC replacement, electrical upgrades, new finishes, and accessibility improvements.", "timeline": "12 months with phased occupancy", "warranty": "1-year warranty on all new systems and finishes"}'::jsonb,
        '[
          {"phase": "Demolition & Prep", "description": "Interior demolition and hazmat abatement", "amount": 180000},
          {"phase": "HVAC Replacement", "description": "New energy-efficient HVAC system", "amount": 425000},
          {"phase": "Electrical Upgrades", "description": "Panel upgrades and new lighting", "amount": 285000},
          {"phase": "Interior Finishes", "description": "New flooring, ceilings, and paint", "amount": 395000},
          {"phase": "Accessibility", "description": "ADA compliance upgrades", "amount": 125000}
        ]'::jsonb,
        1410000, 'accepted', CURRENT_DATE - 90, pm_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_3, client_1_id,
        'Shopping Center Development Proposal',
        '{"introduction": "New construction proposal for a 45,000 SF retail shopping center with parking for 200 vehicles.", "scope": "Complete site development, building construction, tenant improvements, and landscaping.", "timeline": "24 months from groundbreaking to certificate of occupancy", "warranty": "1-year warranty on construction, 2-year warranty on roofing system"}'::jsonb,
        '[
          {"phase": "Site Development", "description": "Grading, utilities, and parking lot", "amount": 875000},
          {"phase": "Building Shell", "description": "Foundation, structure, and exterior envelope", "amount": 1250000},
          {"phase": "Core & Shell MEP", "description": "Base building mechanical, electrical, plumbing", "amount": 625000},
          {"phase": "Common Areas", "description": "Lobbies, restrooms, and corridors", "amount": 285000},
          {"phase": "Site Improvements", "description": "Landscaping, signage, and lighting", "amount": 215000}
        ]'::jsonb,
        3250000, 'accepted', CURRENT_DATE - 100, admin_user_id
      ),
      
      -- New Proposal (sent, awaiting response)
      (
        gen_random_uuid(), demo_firm_id, demo_project_1, client_1_id,
        'Riverside Apartments - Additional Amenities',
        '{"introduction": "Proposal for additional amenity spaces including fitness center and community room.", "scope": "Construction of 2,500 SF amenity building with fitness equipment, community room, and outdoor patio.", "timeline": "6 months, can run concurrent with main building", "warranty": "1-year warranty matching main project"}'::jsonb,
        '[
          {"phase": "Building Construction", "description": "Foundation, framing, and exterior", "amount": 185000},
          {"phase": "Interior Finishes", "description": "Flooring, paint, and fixtures", "amount": 95000},
          {"phase": "Equipment", "description": "Fitness equipment and furniture", "amount": 65000},
          {"phase": "Outdoor Patio", "description": "Covered patio with seating", "amount": 45000}
        ]'::jsonb,
        390000, 'sent', CURRENT_DATE - 7, admin_user_id
      )
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- REPORTS (Daily Site Reports)
    -- ============================================
    INSERT INTO reports (
      id, firm_id, project_id, title, field_notes, ai_narrative, photos, disclaimer, status, sent_at, created_by
    )
    VALUES
      -- Project 1 Reports
      (
        gen_random_uuid(), demo_firm_id, demo_project_1,
        'Daily Report - Foundation Inspection Passed',
        'Foundation inspection completed successfully. Inspector approved all concrete work and rebar placement. Ready to proceed with backfill. Weather: Clear, 72°F. Crew: 8 workers on site.',
        'Today marked a significant milestone with the successful completion of the foundation inspection. The city inspector thoroughly reviewed all concrete work and rebar placement, providing approval to proceed. The foundation demonstrates excellent quality with proper curing and no visible defects. Weather conditions remained favorable throughout the day, allowing the crew of 8 workers to prepare for the next phase of backfilling operations.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 5, pm_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_1,
        'Daily Report - Steel Erection Progress',
        'Steel erection crew installed 12 beams on second floor. All connections torqued to spec. Safety inspection completed - no issues. Weather: Partly cloudy, 68°F. Crew: 6 ironworkers, 2 crane operators.',
        'The steel erection phase continues to progress on schedule with the installation of 12 structural beams on the second floor level. All beam connections were properly torqued to specification and verified by the site supervisor. A comprehensive safety inspection was conducted with no issues identified. The experienced crew of 6 ironworkers and 2 crane operators maintained excellent safety practices throughout the day despite variable weather conditions.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 3, pm_user_id
      ),
      
      -- Project 2 Reports
      (
        gen_random_uuid(), demo_firm_id, demo_project_2,
        'Daily Report - HVAC Installation Complete',
        'HVAC contractor completed main system installation. All units mounted and connected. Ductwork installation 95% complete. Testing scheduled for next week. Weather: Clear, 75°F. Crew: 4 HVAC techs.',
        'The HVAC installation phase reached substantial completion today with all main system units successfully mounted and connected. The mechanical contractor''s crew of 4 experienced technicians worked efficiently to complete the ductwork installation, now at 95% completion. System testing and balancing are scheduled for next week. The new energy-efficient system will significantly improve building performance and occupant comfort.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 4, pm_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_2,
        'Daily Report - Lobby Finishes Progress',
        'Lobby renovation progressing well. Marble flooring 60% installed. Ceiling grid complete, tiles being installed. Lighting fixtures delivered. Weather: Indoor work. Crew: 5 finishers.',
        'The lobby renovation continues to transform the space with high-quality finishes. The marble flooring installation has reached 60% completion, showcasing the elegant design selected by the client. The ceiling grid system is fully installed and tile installation is underway. All lighting fixtures have been delivered and are ready for installation. The crew of 5 skilled finishers is maintaining excellent quality standards throughout the work.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 2, pm_user_id
      ),
      
      -- Project 3 Reports
      (
        gen_random_uuid(), demo_firm_id, demo_project_3,
        'Daily Report - Site Grading Complete',
        'Final grading completed for entire site. Elevations verified by surveyor - all within tolerance. Storm drainage system tested and approved. Weather: Clear, 70°F. Crew: 3 operators, 2 laborers.',
        'A major milestone was achieved today with the completion of final site grading across the entire development. The surveyor verified all elevations are within specified tolerances, ensuring proper drainage and site functionality. The storm drainage system underwent comprehensive testing and received approval from the civil engineer. The experienced crew of 3 equipment operators and 2 laborers executed the work with precision under ideal weather conditions.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 6, pm_user_id
      ),
      (
        gen_random_uuid(), demo_firm_id, demo_project_3,
        'Daily Report - Foundation Excavation Started',
        'Excavation began for main building foundation. Removed 450 cubic yards of soil. Shoring installed on north side. Utilities marked and protected. Weather: Clear, 73°F. Crew: 2 excavator operators, 4 laborers.',
        'Foundation excavation operations commenced today for the main shopping center building. The crew successfully removed approximately 450 cubic yards of soil, maintaining proper slope angles and safety protocols. Shoring was installed on the north side where deeper excavation is required. All underground utilities were clearly marked and protected before excavation began. The team of 2 excavator operators and 4 laborers worked efficiently under favorable weather conditions.',
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'sent', CURRENT_DATE - 8, pm_user_id
      ),
      
      -- Recent draft report
      (
        gen_random_uuid(), demo_firm_id, demo_project_1,
        'Daily Report - Electrical Rough-In Progress',
        'Electrical contractor working on second floor rough-in. Conduit installation 40% complete. Panel boxes mounted. Coordination with plumbing ongoing. Weather: Clear, 71°F. Crew: 4 electricians.',
        NULL,
        '[]'::jsonb,
        'This report represents field observations on the date specified and may not reflect all site conditions.',
        'draft', NULL, pm_user_id
      )
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- DOCUMENTS (Project Documents)
    -- ============================================
    INSERT INTO documents (
      id, firm_id, entity_type, entity_id, name, file_path, file_size, mime_type, uploaded_by
    )
    VALUES
      -- Project 1 Documents
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_1, 'Architectural Plans - Riverside Apartments.pdf', 'documents/riverside-apartments-plans.pdf', 15728640, 'application/pdf', admin_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_1, 'Structural Engineering Drawings.pdf', 'documents/riverside-structural.pdf', 12582912, 'application/pdf', admin_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_1, 'MEP Plans.pdf', 'documents/riverside-mep.pdf', 9437184, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_1, 'Site Plan and Grading.pdf', 'documents/riverside-site-plan.pdf', 5242880, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_1, 'Building Permit.pdf', 'documents/riverside-permit.pdf', 2097152, 'application/pdf', admin_user_id),
      
      -- Project 2 Documents
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_2, 'Renovation Plans - Office Tower.pdf', 'documents/office-tower-plans.pdf', 11534336, 'application/pdf', admin_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_2, 'HVAC System Specifications.pdf', 'documents/office-hvac-specs.pdf', 4194304, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_2, 'Electrical Upgrade Plans.pdf', 'documents/office-electrical.pdf', 6291456, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_2, 'Interior Finishes Schedule.pdf', 'documents/office-finishes.pdf', 3145728, 'application/pdf', pm_user_id),
      
      -- Project 3 Documents
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_3, 'Shopping Center Master Plan.pdf', 'documents/shopping-center-master.pdf', 18874368, 'application/pdf', admin_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_3, 'Civil Engineering Plans.pdf', 'documents/shopping-civil.pdf', 14680064, 'application/pdf', admin_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_3, 'Landscape Design.pdf', 'documents/shopping-landscape.pdf', 8388608, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_3, 'Parking Lot Layout.pdf', 'documents/shopping-parking.pdf', 4194304, 'application/pdf', pm_user_id),
      (gen_random_uuid(), demo_firm_id, 'project', demo_project_3, 'Tenant Improvement Guidelines.pdf', 'documents/shopping-ti-guidelines.pdf', 5242880, 'application/pdf', admin_user_id)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;