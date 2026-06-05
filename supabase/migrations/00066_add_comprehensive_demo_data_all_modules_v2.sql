-- Add comprehensive demo data for all remaining modules

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
  client_1_id uuid;
  client_2_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@lynkpro.com' LIMIT 1;
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;
  SELECT id INTO safety_user_id FROM profiles WHERE email = 'safety@lynkpro.com' LIMIT 1;
  
  -- Get client IDs
  SELECT id INTO client_1_id FROM clients WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO client_2_id FROM clients WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;

  IF admin_user_id IS NOT NULL THEN

    -- ============================================
    -- VENDORS (Material and Equipment Suppliers)
    -- ============================================
    INSERT INTO vendors (id, firm_id, name, contact_name, email, phone, address, rating, on_time_delivery_rate, average_lead_time_days, status, notes)
    VALUES
      (gen_random_uuid(), demo_firm_id, 'ABC Concrete Supply', 'John Martinez', 'orders@abcconcrete.com', '555-0101', '123 Industrial Blvd, Construction City', 4.5, 92.5, 3, 'active', 'Primary concrete supplier - excellent quality'),
      (gen_random_uuid(), demo_firm_id, 'Steel Suppliers Inc', 'Sarah Chen', 'sales@steelsuppliers.com', '555-0102', '456 Steel Ave, Metal Town', 4.8, 95.0, 5, 'active', 'Reliable steel and rebar supplier'),
      (gen_random_uuid(), demo_firm_id, 'Timber Wholesale', 'Mike Johnson', 'mike@timberwholesale.com', '555-0103', '789 Lumber Rd, Wood City', 4.2, 88.0, 4, 'active', 'Good prices on bulk lumber orders'),
      (gen_random_uuid(), demo_firm_id, 'Building Materials Co', 'Lisa Wong', 'info@buildingmaterials.com', '555-0104', '321 Supply St, Builder Town', 4.6, 90.0, 2, 'active', 'One-stop shop for general materials'),
      (gen_random_uuid(), demo_firm_id, 'Electrical Supply House', 'David Brown', 'david@electricalsupply.com', '555-0105', '654 Electric Way, Power City', 4.7, 93.0, 3, 'active', 'Comprehensive electrical supplies'),
      (gen_random_uuid(), demo_firm_id, 'Roofing Supply Co', 'Jennifer Lee', 'sales@roofingsupply.com', '555-0106', '987 Roof Lane, Shingle Town', 4.4, 87.5, 4, 'active', 'Specialized roofing materials'),
      (gen_random_uuid(), demo_firm_id, 'Paint Warehouse', 'Robert Garcia', 'orders@paintwarehouse.com', '555-0107', '147 Color Blvd, Paint City', 4.3, 91.0, 2, 'active', 'Wide selection of paints and finishes'),
      (gen_random_uuid(), demo_firm_id, 'Premium Flooring Supply', 'Amanda Taylor', 'amanda@premiumflooring.com', '555-0108', '258 Floor St, Tile Town', 4.9, 96.0, 7, 'active', 'High-end flooring materials'),
      (gen_random_uuid(), demo_firm_id, 'Door & Hardware Co', 'Chris Anderson', 'sales@doorhardware.com', '555-0109', '369 Hardware Ave, Lock City', 4.5, 89.0, 5, 'active', 'Commercial door systems specialist'),
      (gen_random_uuid(), demo_firm_id, 'Safety Supply Co', 'Maria Rodriguez', 'maria@safetysupply.com', '555-0110', '741 Safety Rd, Protection Town', 4.8, 94.0, 1, 'active', 'PPE and safety equipment supplier')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- SUBCONTRACTORS (Specialty Trade Contractors)
    -- ============================================
    INSERT INTO subcontractors (id, firm_id, company_name, contact_person, email, phone, address, specialty, license_number, insurance_expiry, rating, status, notes)
    VALUES
      (gen_random_uuid(), demo_firm_id, 'Elite Electric Co', 'Tom Wilson', 'tom@eliteelectric.com', '555-0201', '123 Electric St, Voltage City', 'Electrical', 'EL-12345', CURRENT_DATE + 180, 4.7, 'active', 'Licensed electricians - commercial projects'),
      (gen_random_uuid(), demo_firm_id, 'Pro Plumbing Services', 'Nancy Davis', 'nancy@proplumbing.com', '555-0202', '456 Pipe Ave, Water Town', 'Plumbing', 'PL-67890', CURRENT_DATE + 210, 4.6, 'active', 'Full-service plumbing contractor'),
      (gen_random_uuid(), demo_firm_id, 'Climate Control Systems', 'Kevin Park', 'kevin@climatecontrol.com', '555-0203', '789 HVAC Blvd, Air City', 'HVAC', 'HV-11223', CURRENT_DATE + 150, 4.8, 'active', 'Commercial HVAC installation and service'),
      (gen_random_uuid(), demo_firm_id, 'Utility Contractors Inc', 'Rachel Green', 'rachel@utilitycontractors.com', '555-0204', '321 Utility Rd, Service Town', 'Site Utilities', 'UT-44556', CURRENT_DATE + 240, 4.5, 'active', 'Underground utilities specialist'),
      (gen_random_uuid(), demo_firm_id, 'Paving Specialists Co', 'James Miller', 'james@pavingspecialists.com', '555-0205', '654 Asphalt Way, Pave City', 'Paving', 'PV-77889', CURRENT_DATE + 190, 4.4, 'active', 'Parking lots and roadway paving'),
      (gen_random_uuid(), demo_firm_id, 'Structural Steel Erectors', 'Patricia Moore', 'patricia@steelerectors.com', '555-0206', '987 Steel St, Frame Town', 'Steel Erection', 'SE-99001', CURRENT_DATE + 220, 4.9, 'active', 'Certified steel erection crews'),
      (gen_random_uuid(), demo_firm_id, 'Drywall & Finishes LLC', 'Daniel Kim', 'daniel@drywallfinishes.com', '555-0207', '147 Finish Lane, Smooth City', 'Drywall', 'DW-22334', CURRENT_DATE + 160, 4.3, 'active', 'Interior finishing specialists'),
      (gen_random_uuid(), demo_firm_id, 'Roofing Experts Inc', 'Michelle White', 'michelle@roofingexperts.com', '555-0208', '258 Roof Ave, Cover Town', 'Roofing', 'RF-55667', CURRENT_DATE + 200, 4.6, 'active', 'Commercial roofing systems'),
      (gen_random_uuid(), demo_firm_id, 'Glass & Glazing Co', 'Steven Lee', 'steven@glassandglazing.com', '555-0209', '369 Glass Blvd, Clear City', 'Glazing', 'GL-88990', CURRENT_DATE + 175, 4.5, 'active', 'Curtain wall and window systems'),
      (gen_random_uuid(), demo_firm_id, 'Fire Protection Systems', 'Laura Martinez', 'laura@fireprotection.com', '555-0210', '741 Safety Rd, Sprinkler Town', 'Fire Protection', 'FP-11224', CURRENT_DATE + 230, 4.7, 'active', 'Fire sprinkler and alarm systems')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- TASKS (Project To-Do Items)
    -- ============================================
    INSERT INTO tasks (id, firm_id, project_id, title, description, status, priority, assigned_to, due_date, created_by)
    VALUES
      -- Project 1 Tasks
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Complete foundation inspection', 'Schedule and complete final foundation inspection with city inspector', 'in_progress', 'high', pm_user_id, CURRENT_DATE + 2, admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Order steel for second floor', 'Place order for structural steel beams for second floor framing', 'todo', 'high', pm_user_id, CURRENT_DATE + 5, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Schedule electrical rough-in', 'Coordinate with Elite Electric for rough-in inspection next week', 'todo', 'medium', pm_user_id, CURRENT_DATE + 7, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Update safety signage', 'Install new safety signs around excavation areas', 'todo', 'high', safety_user_id, CURRENT_DATE + 1, safety_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Submit change order CO-003', 'Get client approval for additional parking spaces change order', 'in_progress', 'medium', pm_user_id, CURRENT_DATE + 3, admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, 'Concrete pour preparation', 'Prepare forms and rebar for second floor concrete pour', 'done', 'high', field_user_id, CURRENT_DATE - 2, pm_user_id),
      
      -- Project 2 Tasks
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Finalize flooring selection', 'Client needs to approve final flooring materials for office areas', 'todo', 'high', pm_user_id, CURRENT_DATE + 4, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'HVAC system testing', 'Complete testing and balancing of new HVAC system', 'in_progress', 'high', field_user_id, CURRENT_DATE + 6, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Paint touch-ups lobby', 'Complete paint touch-ups in main lobby area', 'todo', 'low', field_user_id, CURRENT_DATE + 8, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Fire alarm final inspection', 'Schedule final fire alarm system inspection', 'todo', 'high', pm_user_id, CURRENT_DATE + 10, safety_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, 'Demolition cleanup', 'Complete cleanup of demolition debris from renovation areas', 'done', 'medium', field_user_id, CURRENT_DATE - 5, pm_user_id),
      
      -- Project 3 Tasks
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Site grading completion', 'Complete final grading and drainage work', 'in_progress', 'high', field_user_id, CURRENT_DATE + 3, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Parking lot striping', 'Schedule parking lot striping after paving cures', 'todo', 'medium', pm_user_id, CURRENT_DATE + 14, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Landscape plan approval', 'Submit landscape plan to city for approval', 'todo', 'medium', pm_user_id, CURRENT_DATE + 7, admin_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Order roofing materials', 'Place order for remaining roofing shingles', 'todo', 'high', pm_user_id, CURRENT_DATE + 2, pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Safety barrier inspection', 'Inspect and repair safety barriers around construction zone', 'todo', 'urgent', safety_user_id, CURRENT_DATE + 1, safety_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, 'Foundation excavation', 'Complete foundation excavation and prepare for footings', 'done', 'high', field_user_id, CURRENT_DATE - 10, pm_user_id)
    ON CONFLICT DO NOTHING;

  END IF;
END $$;