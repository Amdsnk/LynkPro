-- Add missing columns to invoices table
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to have title
UPDATE invoices SET title = 'Invoice ' || invoice_number WHERE title IS NULL;

-- Make title NOT NULL after setting defaults
ALTER TABLE invoices ALTER COLUMN title SET NOT NULL;

-- Create invoice_items table if not exists
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_firm_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)),
    0
  ) + 1 INTO next_number
  FROM invoices
  WHERE firm_id = p_firm_id;
  
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$;

-- RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = invoice_items.invoice_id
      AND i.firm_id = p.firm_id
    )
  );

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE i.id = invoice_items.invoice_id
      AND i.firm_id = pr.firm_id
      AND pr.role IN ('admin', 'staff')
    )
  );