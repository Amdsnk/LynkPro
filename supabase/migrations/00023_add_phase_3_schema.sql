-- =====================================================
-- PHASE 3: FINANCIAL & SECURITY FEATURES
-- =====================================================

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- Orders table for payment tracking
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status order_status NOT NULL DEFAULT 'pending',
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time entries table for time tracking
CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  is_billable boolean DEFAULT true,
  hourly_rate numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recurring invoice frequency enum
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Recurring invoices table
CREATE TABLE recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  template_data jsonb NOT NULL,
  frequency recurring_frequency NOT NULL,
  next_generation_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2FA secrets table
CREATE TABLE totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recovery codes table
CREATE TABLE recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_orders_firm_id ON orders(firm_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_invoice_id ON orders(invoice_id);
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE INDEX idx_time_entries_firm_id ON time_entries(firm_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);

CREATE INDEX idx_recurring_invoices_firm_id ON recurring_invoices(firm_id);
CREATE INDEX idx_recurring_invoices_next_date ON recurring_invoices(next_generation_date);
CREATE INDEX idx_recurring_invoices_active ON recurring_invoices(is_active);

CREATE INDEX idx_totp_secrets_user_id ON totp_secrets(user_id);
CREATE INDEX idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX idx_recovery_codes_code ON recovery_codes(code);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Orders policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage orders"
  ON orders FOR ALL
  TO service_role
  USING (true);

-- Time entries policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view firm time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Recurring invoices policies
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view firm recurring invoices"
  ON recurring_invoices FOR SELECT
  TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can manage recurring invoices"
  ON recurring_invoices FOR ALL
  TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff')
  ));

-- TOTP secrets policies
ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own totp secret"
  ON totp_secrets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own totp secret"
  ON totp_secrets FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Recovery codes policies
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery codes"
  ON recovery_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own recovery codes"
  ON recovery_codes FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Calculate time entry duration
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- Update next generation date for recurring invoices
CREATE OR REPLACE FUNCTION update_next_generation_date(
  recurring_invoice_id uuid,
  frequency recurring_frequency
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_date date;
BEGIN
  SELECT 
    CASE frequency
      WHEN 'weekly' THEN CURRENT_DATE + INTERVAL '7 days'
      WHEN 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
      WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
      WHEN 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
    END
  INTO next_date;
  
  UPDATE recurring_invoices
  SET next_generation_date = next_date,
      updated_at = now()
  WHERE id = recurring_invoice_id;
  
  RETURN next_date;
END;
$$;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE recurring_invoices;