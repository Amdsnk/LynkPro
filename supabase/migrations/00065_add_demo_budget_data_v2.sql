-- Add comprehensive demo budget data for all projects

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  admin_user_id uuid;
  pm_user_id uuid;
  
  -- Cost category IDs for Project 1
  p1_labor_id uuid;
  p1_materials_id uuid;
  p1_equipment_id uuid;
  p1_subcontractor_id uuid;
  p1_overhead_id uuid;
  
  -- Cost category IDs for Project 2
  p2_labor_id uuid;
  p2_materials_id uuid;
  p2_equipment_id uuid;
  p2_subcontractor_id uuid;
  p2_overhead_id uuid;
  
  -- Cost category IDs for Project 3
  p3_labor_id uuid;
  p3_materials_id uuid;
  p3_equipment_id uuid;
  p3_subcontractor_id uuid;
  p3_overhead_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@lynkpro.com' LIMIT 1;
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;

  IF admin_user_id IS NOT NULL THEN

    -- ============================================
    -- PROJECT 1: RIVERSIDE APARTMENTS - COST CATEGORIES
    -- Total Budget: $2,500,000
    -- ============================================
    
    INSERT INTO cost_categories (id, firm_id, project_id, name, category_type, budgeted_amount, description)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Labor Costs', 'labor', 800000.00, 'All labor costs including wages, benefits, and overtime'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Materials & Supplies', 'materials', 900000.00, 'Construction materials, supplies, and consumables'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Equipment Rental & Operations', 'equipment', 350000.00, 'Equipment rental, fuel, and maintenance'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Subcontractor Services', 'subcontractor', 300000.00, 'Electrical, plumbing, HVAC subcontractors'),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Project Overhead', 'overhead', 150000.00, 'Site office, utilities, insurance, permits')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO p1_labor_id FROM cost_categories WHERE project_id = demo_project_1 AND category_type = 'labor' LIMIT 1;
    SELECT id INTO p1_materials_id FROM cost_categories WHERE project_id = demo_project_1 AND category_type = 'materials' LIMIT 1;
    SELECT id INTO p1_equipment_id FROM cost_categories WHERE project_id = demo_project_1 AND category_type = 'equipment' LIMIT 1;
    SELECT id INTO p1_subcontractor_id FROM cost_categories WHERE project_id = demo_project_1 AND category_type = 'subcontractor' LIMIT 1;
    SELECT id INTO p1_overhead_id FROM cost_categories WHERE project_id = demo_project_1 AND category_type = 'overhead' LIMIT 1;

    -- PROJECT 1: ACTUAL COSTS (45% of budget spent)
    INSERT INTO actual_costs (id, firm_id, project_id, cost_category_id, amount, cost_date, description, vendor, invoice_number, recorded_by)
    VALUES
      -- Labor costs (Week 1-4)
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_labor_id, 45000.00, CURRENT_DATE - 28, 'Week 1 - Site preparation crew wages', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_labor_id, 52000.00, CURRENT_DATE - 21, 'Week 2 - Foundation crew wages and overtime', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_labor_id, 48000.00, CURRENT_DATE - 14, 'Week 3 - Concrete and steel crew wages', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_labor_id, 50000.00, CURRENT_DATE - 7, 'Week 4 - Framing crew wages', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_labor_id, 55000.00, CURRENT_DATE - 3, 'Current week - Multiple crews wages', NULL, NULL, pm_user_id),
      
      -- Materials costs
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_materials_id, 125000.00, CURRENT_DATE - 25, 'Concrete delivery - Foundation pour', 'ABC Concrete Supply', 'INV-2024-1001', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_materials_id, 85000.00, CURRENT_DATE - 20, 'Steel rebar and structural steel', 'Steel Suppliers Inc', 'INV-2024-1045', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_materials_id, 42000.00, CURRENT_DATE - 15, 'Lumber package - Framing materials', 'Timber Wholesale', 'INV-2024-2156', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_materials_id, 28000.00, CURRENT_DATE - 10, 'Drywall and insulation materials', 'Building Materials Co', 'INV-2024-3421', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_materials_id, 15000.00, CURRENT_DATE - 5, 'Electrical wire and conduit', 'Electrical Supply House', 'INV-2024-4567', pm_user_id),
      
      -- Equipment costs
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_equipment_id, 35000.00, CURRENT_DATE - 28, 'Tower crane rental - Month 1', 'Crane Rentals LLC', 'INV-CR-1001', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_equipment_id, 12000.00, CURRENT_DATE - 22, 'Excavator fuel and maintenance', 'Equipment Services', 'INV-ES-2234', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_equipment_id, 8500.00, CURRENT_DATE - 15, 'Small tools and equipment rental', 'Tool Rental Co', 'INV-TR-5678', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_equipment_id, 6500.00, CURRENT_DATE - 8, 'Generator fuel and service', 'Power Equipment Inc', 'INV-PE-3456', pm_user_id),
      
      -- Subcontractor costs
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_subcontractor_id, 45000.00, CURRENT_DATE - 18, 'Electrical rough-in - Progress payment 1', 'Elite Electric Co', 'INV-EE-1234', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_subcontractor_id, 38000.00, CURRENT_DATE - 12, 'Plumbing rough-in - Progress payment 1', 'Pro Plumbing Services', 'INV-PP-5678', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_subcontractor_id, 25000.00, CURRENT_DATE - 6, 'HVAC ductwork installation - Partial', 'Climate Control Systems', 'INV-CC-9012', pm_user_id),
      
      -- Overhead costs
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_overhead_id, 5000.00, CURRENT_DATE - 30, 'Building permit fees', 'City Building Department', 'BP-2024-001234', admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_overhead_id, 3500.00, CURRENT_DATE - 25, 'Site office trailer rental - Month 1', 'Mobile Office Rentals', 'INV-MO-1111', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_overhead_id, 2800.00, CURRENT_DATE - 20, 'Site utilities - Water and power', 'City Utilities', 'UTIL-2024-456', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_overhead_id, 8500.00, CURRENT_DATE - 15, 'General liability insurance - Quarter 1', 'Construction Insurance Co', 'POL-2024-7890', admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, p1_overhead_id, 1200.00, CURRENT_DATE - 10, 'Safety equipment and supplies', 'Safety Supply Co', 'INV-SS-3344', pm_user_id)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- PROJECT 2: OFFICE TOWER RENOVATION - COST CATEGORIES
    -- Total Budget: $1,800,000
    -- ============================================
    
    INSERT INTO cost_categories (id, firm_id, project_id, name, category_type, budgeted_amount, description)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Labor Costs', 'labor', 550000.00, 'Renovation crew wages and benefits'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Materials & Finishes', 'materials', 650000.00, 'Interior finishes, fixtures, and materials'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Equipment & Tools', 'equipment', 180000.00, 'Specialized renovation equipment'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Subcontractor Services', 'subcontractor', 320000.00, 'MEP upgrades and specialty trades'),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Project Overhead', 'overhead', 100000.00, 'Project management and site costs')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO p2_labor_id FROM cost_categories WHERE project_id = demo_project_2 AND category_type = 'labor' LIMIT 1;
    SELECT id INTO p2_materials_id FROM cost_categories WHERE project_id = demo_project_2 AND category_type = 'materials' LIMIT 1;
    SELECT id INTO p2_equipment_id FROM cost_categories WHERE project_id = demo_project_2 AND category_type = 'equipment' LIMIT 1;
    SELECT id INTO p2_subcontractor_id FROM cost_categories WHERE project_id = demo_project_2 AND category_type = 'subcontractor' LIMIT 1;
    SELECT id INTO p2_overhead_id FROM cost_categories WHERE project_id = demo_project_2 AND category_type = 'overhead' LIMIT 1;

    -- PROJECT 2: ACTUAL COSTS (35% of budget spent)
    INSERT INTO actual_costs (id, firm_id, project_id, cost_category_id, amount, cost_date, description, vendor, invoice_number, recorded_by)
    VALUES
      -- Labor costs
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_labor_id, 38000.00, CURRENT_DATE - 25, 'Demolition crew - Week 1-2', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_labor_id, 42000.00, CURRENT_DATE - 18, 'Interior renovation crew - Week 3-4', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_labor_id, 45000.00, CURRENT_DATE - 10, 'Finish carpentry and installation crew', NULL, NULL, pm_user_id),
      
      -- Materials costs
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_materials_id, 65000.00, CURRENT_DATE - 22, 'Drywall, framing, and insulation package', 'Building Materials Co', 'INV-2024-5678', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_materials_id, 48000.00, CURRENT_DATE - 16, 'Flooring materials - Carpet and tile', 'Premium Flooring Supply', 'INV-PF-2345', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_materials_id, 32000.00, CURRENT_DATE - 12, 'Interior doors and hardware', 'Door & Hardware Co', 'INV-DH-6789', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_materials_id, 28000.00, CURRENT_DATE - 8, 'Paint and finishing materials', 'Paint Warehouse', 'INV-PW-4321', pm_user_id),
      
      -- Equipment costs
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_equipment_id, 15000.00, CURRENT_DATE - 24, 'Scissor lifts rental - Month 1', 'Access Equipment Rentals', 'INV-AE-1122', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_equipment_id, 8500.00, CURRENT_DATE - 15, 'Specialized demolition equipment', 'Demo Equipment Co', 'INV-DE-3344', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_equipment_id, 5500.00, CURRENT_DATE - 8, 'Power tools and equipment', 'Tool Supply Inc', 'INV-TS-5566', pm_user_id),
      
      -- Subcontractor costs
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_subcontractor_id, 55000.00, CURRENT_DATE - 20, 'HVAC system upgrade - Progress payment 1', 'Climate Control Systems', 'INV-CC-7788', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_subcontractor_id, 42000.00, CURRENT_DATE - 14, 'Electrical upgrades - Progress payment 1', 'Elite Electric Co', 'INV-EE-9900', pm_user_id),
      
      -- Overhead costs
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_overhead_id, 8500.00, CURRENT_DATE - 28, 'Renovation permits and fees', 'City Building Department', 'BP-2024-002345', admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_overhead_id, 4500.00, CURRENT_DATE - 20, 'Temporary protection and barriers', 'Safety Barrier Co', 'INV-SB-1234', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, p2_overhead_id, 3200.00, CURRENT_DATE - 12, 'Waste disposal and dumpster rental', 'Waste Management Inc', 'INV-WM-5678', pm_user_id)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- PROJECT 3: SHOPPING CENTER - COST CATEGORIES
    -- Total Budget: $3,200,000
    -- ============================================
    
    INSERT INTO cost_categories (id, firm_id, project_id, name, category_type, budgeted_amount, description)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Labor Costs', 'labor', 950000.00, 'Construction crew wages and supervision'),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Materials & Supplies', 'materials', 1200000.00, 'Building materials and retail finishes'),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Equipment Operations', 'equipment', 420000.00, 'Heavy equipment and site machinery'),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Subcontractor Services', 'subcontractor', 480000.00, 'Specialty trades and systems'),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Project Overhead', 'overhead', 150000.00, 'Site management and indirect costs')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO p3_labor_id FROM cost_categories WHERE project_id = demo_project_3 AND category_type = 'labor' LIMIT 1;
    SELECT id INTO p3_materials_id FROM cost_categories WHERE project_id = demo_project_3 AND category_type = 'materials' LIMIT 1;
    SELECT id INTO p3_equipment_id FROM cost_categories WHERE project_id = demo_project_3 AND category_type = 'equipment' LIMIT 1;
    SELECT id INTO p3_subcontractor_id FROM cost_categories WHERE project_id = demo_project_3 AND category_type = 'subcontractor' LIMIT 1;
    SELECT id INTO p3_overhead_id FROM cost_categories WHERE project_id = demo_project_3 AND category_type = 'overhead' LIMIT 1;

    -- PROJECT 3: ACTUAL COSTS (25% of budget spent)
    INSERT INTO actual_costs (id, firm_id, project_id, cost_category_id, amount, cost_date, description, vendor, invoice_number, recorded_by)
    VALUES
      -- Labor costs
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_labor_id, 55000.00, CURRENT_DATE - 20, 'Site preparation and grading crew', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_labor_id, 62000.00, CURRENT_DATE - 12, 'Foundation and structural crew', NULL, NULL, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_labor_id, 48000.00, CURRENT_DATE - 5, 'Roofing crew wages', NULL, NULL, pm_user_id),
      
      -- Materials costs
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_materials_id, 145000.00, CURRENT_DATE - 18, 'Concrete and foundation materials', 'ABC Concrete Supply', 'INV-2024-7890', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_materials_id, 95000.00, CURRENT_DATE - 14, 'Structural steel package', 'Steel Suppliers Inc', 'INV-2024-8901', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_materials_id, 68000.00, CURRENT_DATE - 8, 'Roofing materials and supplies', 'Roofing Supply Co', 'INV-RS-2345', pm_user_id),
      
      -- Equipment costs
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_equipment_id, 42000.00, CURRENT_DATE - 22, 'Heavy equipment rental - Month 1', 'Heavy Equipment Rentals', 'INV-HE-1234', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_equipment_id, 18000.00, CURRENT_DATE - 15, 'Crane services and operations', 'Crane Services LLC', 'INV-CS-5678', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_equipment_id, 12000.00, CURRENT_DATE - 8, 'Site equipment fuel and maintenance', 'Equipment Services', 'INV-ES-9012', pm_user_id),
      
      -- Subcontractor costs
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_subcontractor_id, 75000.00, CURRENT_DATE - 16, 'Site utilities installation', 'Utility Contractors Inc', 'INV-UC-3456', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_subcontractor_id, 52000.00, CURRENT_DATE - 10, 'Parking lot paving - Deposit', 'Paving Specialists Co', 'INV-PS-7890', pm_user_id),
      
      -- Overhead costs
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_overhead_id, 6000.00, CURRENT_DATE - 25, 'Building permits and impact fees', 'City Building Department', 'BP-2024-003456', admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_overhead_id, 4200.00, CURRENT_DATE - 18, 'Site security services - Month 1', 'Security Services Inc', 'INV-SEC-1122', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, p3_overhead_id, 3800.00, CURRENT_DATE - 12, 'Temporary facilities and fencing', 'Site Services Co', 'INV-SS-3344', pm_user_id)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;