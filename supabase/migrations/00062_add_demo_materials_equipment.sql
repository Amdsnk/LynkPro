-- Add demo data for materials and equipment

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@lynkpro.com' LIMIT 1;

  IF admin_user_id IS NOT NULL THEN

    -- MATERIALS (using correct enum values: kg, ton, liter, m3, piece, box, bag)
    INSERT INTO materials (id, firm_id, name, description, unit, current_quantity, min_quantity, unit_cost, status, supplier_name, supplier_contact)
    VALUES
      (gen_random_uuid(), demo_firm_id, 'Concrete Mix', 'High-strength concrete mix for foundation', 'm3', 500, 100, 120.00, 'in_stock', 'ABC Concrete Supply', '+1-555-0101'),
      (gen_random_uuid(), demo_firm_id, 'Steel Rebar #5', 'Grade 60 steel reinforcement bars', 'piece', 2000, 500, 8.50, 'in_stock', 'Steel Suppliers Inc', '+1-555-0102'),
      (gen_random_uuid(), demo_firm_id, 'Lumber 2x4', 'Pressure-treated lumber for framing', 'piece', 1500, 300, 6.75, 'in_stock', 'Timber Wholesale', '+1-555-0103'),
      (gen_random_uuid(), demo_firm_id, 'Drywall Sheets', '4x8 ft standard drywall sheets', 'piece', 800, 200, 12.00, 'in_stock', 'Building Materials Co', '+1-555-0104'),
      (gen_random_uuid(), demo_firm_id, 'Electrical Wire 12AWG', '12 AWG copper electrical wire (per meter)', 'piece', 5000, 1000, 0.85, 'in_stock', 'Electrical Supply House', '+1-555-0105'),
      (gen_random_uuid(), demo_firm_id, 'HVAC Ductwork', 'Galvanized steel ductwork (per meter)', 'piece', 300, 50, 25.00, 'in_stock', 'HVAC Distributors', '+1-555-0106'),
      (gen_random_uuid(), demo_firm_id, 'Roofing Shingles', 'Architectural asphalt shingles', 'box', 250, 50, 35.00, 'in_stock', 'Roofing Supply Co', '+1-555-0107'),
      (gen_random_uuid(), demo_firm_id, 'Paint - Interior', 'Low-VOC interior latex paint', 'liter', 150, 30, 45.00, 'in_stock', 'Paint Warehouse', '+1-555-0108'),
      (gen_random_uuid(), demo_firm_id, 'Plywood 3/4"', '3/4 inch plywood sheets', 'piece', 200, 50, 42.00, 'low_stock', 'Timber Wholesale', '+1-555-0103'),
      (gen_random_uuid(), demo_firm_id, 'PVC Pipe 4"', '4 inch PVC drainage pipe (per meter)', 'piece', 800, 200, 3.50, 'in_stock', 'Plumbing Supply Co', '+1-555-0109'),
      (gen_random_uuid(), demo_firm_id, 'Cement Bags', 'Portland cement 50kg bags', 'bag', 500, 100, 12.50, 'in_stock', 'ABC Concrete Supply', '+1-555-0101'),
      (gen_random_uuid(), demo_firm_id, 'Sand', 'Construction grade sand', 'ton', 50, 10, 35.00, 'in_stock', 'Aggregate Supply Co', '+1-555-0110'),
      (gen_random_uuid(), demo_firm_id, 'Gravel', 'Crushed stone aggregate', 'ton', 75, 15, 40.00, 'in_stock', 'Aggregate Supply Co', '+1-555-0110'),
      (gen_random_uuid(), demo_firm_id, 'Insulation Rolls', 'Fiberglass insulation R-19', 'piece', 300, 50, 28.00, 'in_stock', 'Building Materials Co', '+1-555-0104'),
      (gen_random_uuid(), demo_firm_id, 'Nails - Framing', 'Framing nails 16d', 'box', 100, 20, 18.00, 'in_stock', 'Hardware Supply', '+1-555-0111')
    ON CONFLICT DO NOTHING;

    -- EQUIPMENT (using correct enum values: available, in_use, maintenance, out_of_service)
    INSERT INTO equipment (id, firm_id, name, equipment_type, model, serial_number, purchase_date, purchase_cost, status, current_location, current_project_id, notes)
    VALUES
      (gen_random_uuid(), demo_firm_id, 'Excavator CAT 320', 'Heavy Machinery', 'CAT 320', 'CAT320-2024-001', '2024-01-15', 185000.00, 'in_use', 'Site A - Foundation Area', demo_project_1, 'Primary excavator for foundation work'),
      (gen_random_uuid(), demo_firm_id, 'Concrete Mixer', 'Mixing Equipment', 'CM-9CF', 'MIX-2024-002', '2024-02-01', 3500.00, 'in_use', 'Site A - Mixing Station', demo_project_1, 'Portable 9 cu ft mixer'),
      (gen_random_uuid(), demo_firm_id, 'Tower Crane', 'Lifting Equipment', 'Liebherr 150 EC-B', 'LIE-150-003', '2024-01-20', 450000.00, 'in_use', 'Site A - Central', demo_project_1, 'Main tower crane'),
      (gen_random_uuid(), demo_firm_id, 'Scissor Lift 26ft', 'Access Equipment', 'SL-26E', 'LIFT-2024-004', '2024-03-01', 18000.00, 'in_use', 'Floor 8', demo_project_2, 'Electric scissor lift'),
      (gen_random_uuid(), demo_firm_id, 'Welding Machine', 'Welding Equipment', 'MIG-200A', 'WELD-2024-005', '2024-02-15', 2800.00, 'available', 'Equipment Room', NULL, 'MIG welding machine'),
      (gen_random_uuid(), demo_firm_id, 'Forklift', 'Material Handling', 'Toyota 5000lb', 'FORK-2024-006', '2024-01-10', 32000.00, 'in_use', 'Loading Dock', demo_project_3, '5000 lb capacity'),
      (gen_random_uuid(), demo_firm_id, 'Generator 50kW', 'Power Equipment', 'GEN-50D', 'GEN-2024-007', '2024-01-05', 15000.00, 'available', 'Equipment Yard', NULL, 'Diesel backup generator'),
      (gen_random_uuid(), demo_firm_id, 'Air Compressor', 'Air Tools', 'AC-185CFM', 'COMP-2024-008', '2024-02-20', 4200.00, 'maintenance', 'Maintenance Shop', NULL, 'Scheduled maintenance'),
      (gen_random_uuid(), demo_firm_id, 'Boom Lift 40ft', 'Access Equipment', 'BL-40', 'BOOM-2024-009', '2024-03-10', 28000.00, 'in_use', 'Exterior - South Side', demo_project_2, 'Articulating boom lift'),
      (gen_random_uuid(), demo_firm_id, 'Skid Steer Loader', 'Heavy Machinery', 'Bobcat S650', 'BOB-2024-010', '2024-01-25', 45000.00, 'in_use', 'Site A - Material Yard', demo_project_1, 'Compact loader'),
      (gen_random_uuid(), demo_firm_id, 'Dump Truck', 'Transportation', 'Ford F-750', 'DUMP-2024-011', '2024-02-10', 85000.00, 'available', 'Equipment Yard', NULL, '10-yard dump truck'),
      (gen_random_uuid(), demo_firm_id, 'Plate Compactor', 'Compaction Equipment', 'PC-5000', 'COMP-2024-012', '2024-03-05', 1800.00, 'in_use', 'Site A - Foundation', demo_project_1, 'Vibratory plate compactor')
    ON CONFLICT DO NOTHING;

  END IF;
END $$;