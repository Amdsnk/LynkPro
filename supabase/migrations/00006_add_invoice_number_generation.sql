-- Create a sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1000;

-- Create a function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get next sequence value
  next_num := nextval('invoice_number_seq');
  
  -- Format as INV-YYYY-NNNN
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$;

-- Create trigger to auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();