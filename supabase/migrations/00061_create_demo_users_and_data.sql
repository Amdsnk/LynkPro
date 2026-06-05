-- Create demo users with different roles for LynkPro
-- This migration creates a complete demo environment with users, firm, projects, and data

-- First, create a demo firm
INSERT INTO firms (id, name, email, phone, address, default_proposal_terms, default_invoice_terms)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'LynkPro Demo Construction',
  'demo@lynkpro.com',
  '+1 (555) 123-4567',
  '123 Construction Ave, Builder City, BC 12345',
  'Payment terms: Net 30 days. All work performed according to specifications and industry standards.',
  'Payment due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Create demo user profiles (these will be linked when users sign up)
-- Note: Actual auth.users entries must be created through Supabase Auth signup

-- Create a function to setup demo user profile
CREATE OR REPLACE FUNCTION setup_demo_user_profile(
  user_id uuid,
  user_email text,
  user_full_name text,
  user_role user_role,
  user_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, firm_id, phone, is_active)
  VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    '00000000-0000-0000-0000-000000000001'::uuid,
    user_phone,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    firm_id = EXCLUDED.firm_id,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active;
END;
$$;

-- Create demo clients for the firm
INSERT INTO clients (id, firm_id, name, email, phone, address, created_by)
SELECT
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Acme Real Estate Development',
  'contact@acmerealestate.com',
  '+1 (555) 234-5678',
  '456 Property Lane, Builder City, BC 12345',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

INSERT INTO clients (id, firm_id, name, email, phone, address, created_by)
SELECT
  '00000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Downtown Commercial Properties',
  'info@downtowncommercial.com',
  '+1 (555) 345-6789',
  '789 Business Blvd, Builder City, BC 12345',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Create demo projects
INSERT INTO projects (id, firm_id, client_id, name, description, status, created_by)
SELECT
  '00000000-0000-0000-0000-000000000020'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000010'::uuid,
  'Riverside Luxury Apartments',
  'Construction of a 12-story luxury apartment complex with 150 units, underground parking, and amenities including pool, gym, and rooftop terrace.',
  'active'::project_status,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO projects (id, firm_id, client_id, name, description, status, created_by)
SELECT
  '00000000-0000-0000-0000-000000000021'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000011'::uuid,
  'Downtown Office Tower Renovation',
  'Complete renovation of 20-story office building including HVAC upgrade, elevator modernization, and interior fit-out.',
  'active'::project_status,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO projects (id, firm_id, client_id, name, description, status, created_by)
SELECT
  '00000000-0000-0000-0000-000000000022'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000010'::uuid,
  'Suburban Shopping Center',
  'New construction of 50,000 sq ft retail shopping center with parking for 200 vehicles.',
  'on_hold'::project_status,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Create a view for demo user credentials (for documentation purposes)
CREATE OR REPLACE VIEW demo_user_credentials AS
SELECT
  'Admin User' as role_name,
  'admin@lynkpro.com' as email,
  'demo123' as password,
  'Full system access - can manage all features, users, and settings' as description,
  1 as sort_order
UNION ALL
SELECT
  'Project Manager',
  'pm@lynkpro.com',
  'demo123',
  'Staff role - can manage projects, tasks, budgets, and team members',
  2
UNION ALL
SELECT
  'Field Worker',
  'field@lynkpro.com',
  'demo123',
  'Staff role - focused on field operations, daily reports, and safety',
  3
UNION ALL
SELECT
  'Safety Officer',
  'safety@lynkpro.com',
  'demo123',
  'Staff role - manages safety audits, compliance, and risk assessments',
  4
UNION ALL
SELECT
  'Client User',
  'client@lynkpro.com',
  'demo123',
  'Client portal access - view-only access to assigned projects',
  5
UNION ALL
SELECT
  'Subcontractor',
  'subcontractor@lynkpro.com',
  'demo123',
  'Subcontractor portal - can submit timesheets and view assigned tasks',
  6
ORDER BY sort_order;

-- Create a table to store demo user information
CREATE TABLE IF NOT EXISTS demo_users_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  description text,
  user_role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert demo user information
INSERT INTO demo_users_info (role_name, email, password, description, user_role)
VALUES
  ('Admin User', 'admin@lynkpro.com', 'demo123', 'Full system access - can manage all features, users, and settings', 'admin'),
  ('Project Manager', 'pm@lynkpro.com', 'demo123', 'Staff role - can manage projects, tasks, budgets, and team members', 'staff'),
  ('Field Worker', 'field@lynkpro.com', 'demo123', 'Staff role - focused on field operations, daily reports, and safety', 'staff'),
  ('Safety Officer', 'safety@lynkpro.com', 'demo123', 'Staff role - manages safety audits, compliance, and risk assessments', 'staff'),
  ('Client User', 'client@lynkpro.com', 'demo123', 'Client portal access - view-only access to assigned projects', 'client'),
  ('Subcontractor', 'subcontractor@lynkpro.com', 'demo123', 'Subcontractor portal - can submit timesheets and view assigned tasks', 'client')
ON CONFLICT (email) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  user_role = EXCLUDED.user_role;

COMMENT ON TABLE demo_users_info IS 'Demo user credentials for LynkPro. These users must be created through Supabase Auth signup.';
COMMENT ON VIEW demo_user_credentials IS 'View of demo user credentials for easy reference. Password: demo123 for all users.';