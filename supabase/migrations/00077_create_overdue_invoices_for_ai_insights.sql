-- Create overdue invoices to generate AI insights

-- Update INV-2026-004 to be overdue (was due 2026-04-28, make it due 2026-04-15)
UPDATE invoices
SET due_date = '2026-04-15'
WHERE invoice_number = 'INV-2026-004';

-- Create a new overdue invoice for Shopping Center
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
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000022', -- Shopping Center
  (SELECT client_id FROM projects WHERE id = '00000000-0000-0000-0000-000000000022'),
  'INV-2026-007',
  'Foundation Work - Progress Payment',
  'Progress payment for foundation and site preparation work',
  '[{"description": "Foundation excavation and preparation", "quantity": 1, "unit_price": 125000, "amount": 125000}, {"description": "Concrete foundation pour", "quantity": 1, "unit_price": 60000, "amount": 60000}, {"description": "Site grading and drainage", "quantity": 1, "unit_price": 18500, "amount": 18500}]'::jsonb,
  203500.00,
  NULL,
  'sent',
  '2026-03-15',
  '2026-04-10', -- Overdue by 17 days
  'Progress payment for foundation work - 30% completion milestone',
  '00000000-0000-0000-0000-000000000010', -- PM
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'INV-2026-007');