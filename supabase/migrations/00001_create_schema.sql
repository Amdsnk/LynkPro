-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'client');

-- Create status enums
CREATE TYPE public.project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');
CREATE TYPE public.proposal_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE public.report_status AS ENUM ('draft', 'sent');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL DEFAULT 'client',
  firm_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Firms table
CREATE TABLE public.firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  email text,
  phone text,
  address text,
  default_proposal_terms text,
  default_invoice_terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'active',
  internal_notes text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Project members (for client access)
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Proposal templates
CREATE TABLE public.proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id uuid REFERENCES proposal_templates(id),
  title text NOT NULL,
  content jsonb NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]',
  total_amount numeric(12,2),
  status proposal_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]',
  total_amount numeric(12,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(firm_id, invoice_number)
);

-- Field reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  field_notes text NOT NULL,
  ai_narrative text,
  photos jsonb NOT NULL DEFAULT '[]',
  disclaimer text NOT NULL,
  status report_status NOT NULL DEFAULT 'draft',
  approved_at timestamptz,
  sent_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Files table
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb,
  user_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Client invitations table
CREATE TABLE public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profiles_firm_id ON profiles(firm_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_projects_firm_id ON projects(firm_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_proposals_firm_id ON proposals(firm_id);
CREATE INDEX idx_proposals_project_id ON proposals(project_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_invoices_firm_id ON invoices(firm_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_reports_firm_id ON reports(firm_id);
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('report-photos', 'report-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('firm-logos', 'firm-logos', true);