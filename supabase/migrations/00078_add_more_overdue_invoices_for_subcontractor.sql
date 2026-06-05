-- Add more overdue invoices for AI insights

-- Create overdue invoice for Shopping Center
INSERT INTO invoices (
  id,
  firm_id,
  project_id,
  client_id,
  invoice_number,
  title,
  description,
  line_items,
  total_amount,
  paid_amount,
  status,
  issue_date,
  due_date,
  notes,
  created_by,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000022', -- Shopping Center
  (SELECT client_id FROM projects WHERE id = '00000000-0000-0000-0000-000000000022'),
  'INV-2026-008',
  'Foundation Work - Progress Payment',
  'Progress payment for foundation and site preparation work',
  '[{"description": "Foundation excavation and preparation", "quantity": 1, "unit_price": 125000, "amount": 125000}, {"description": "Concrete foundation pour", "quantity": 1, "unit_price": 60000, "amount": 60000}, {"description": "Site grading and drainage", "quantity": 1, "unit_price": 18500, "amount": 18500}]'::jsonb,
  203500.00,
  NULL,
  'sent',
  '2026-03-15',
  '2026-04-10', -- Overdue by 17 days
  'Progress payment for foundation work - 30% completion milestone',
  '3c1976c1-5eeb-4fe1-b248-56228e9042c7', -- Admin user
  NOW(),
  NOW()
);

-- Create another overdue invoice for Downtown Office Tower
INSERT INTO invoices (
  id,
  firm_id,
  project_id,
  client_id,
  invoice_number,
  title,
  description,
  line_items,
  total_amount,
  paid_amount,
  status,
  issue_date,
  due_date,
  notes,
  created_by,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000021', -- Downtown Office Tower
  (SELECT client_id FROM projects WHERE id = '00000000-0000-0000-0000-000000000021'),
  'INV-2026-009',
  'Structural Steel - Progress Payment',
  'Progress payment for structural steel installation',
  '[{"description": "Structural steel beams", "quantity": 1, "unit_price": 180000, "amount": 180000}, {"description": "Steel installation labor", "quantity": 1, "unit_price": 95000, "amount": 95000}]'::jsonb,
  275000.00,
  NULL,
  'sent',
  '2026-03-20',
  '2026-04-12', -- Overdue by 15 days
  'Progress payment for structural steel work - 40% completion milestone',
  '3c1976c1-5eeb-4fe1-b248-56228e9042c7', -- Admin user
  NOW(),
  NOW()
);