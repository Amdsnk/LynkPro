-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION has_role(uid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = role_name::user_role
  );
$$;

CREATE OR REPLACE FUNCTION get_user_firm_id(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT firm_id FROM profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION is_project_member(uid uuid, proj_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.user_id = uid AND pm.project_id = proj_id
  );
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and staff can view all profiles in their firm" ON profiles
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Admins can update all profiles in their firm" ON profiles
  FOR UPDATE TO authenticated USING (
    has_role(auth.uid(), 'admin') AND firm_id = get_user_firm_id(auth.uid())
  );

-- Firms policies
CREATE POLICY "Users can view their own firm" ON firms
  FOR SELECT TO authenticated USING (
    id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Admins can update their firm" ON firms
  FOR UPDATE TO authenticated USING (
    has_role(auth.uid(), 'admin') AND id = get_user_firm_id(auth.uid())
  );

-- Clients policies
CREATE POLICY "Staff can view clients in their firm" ON clients
  FOR SELECT TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) 
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Staff can create clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Staff can update clients in their firm" ON clients
  FOR UPDATE TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Staff can delete clients in their firm" ON clients
  FOR DELETE TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

-- Projects policies
CREATE POLICY "Staff can view projects in their firm" ON projects
  FOR SELECT TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Clients can view their assigned projects" ON projects
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'client') AND is_project_member(auth.uid(), id)
  );

CREATE POLICY "Staff can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Staff can update projects in their firm" ON projects
  FOR UPDATE TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Staff can delete projects in their firm" ON projects
  FOR DELETE TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

-- Project members policies
CREATE POLICY "Staff can manage project members" ON project_members
  FOR ALL TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  );

CREATE POLICY "Users can view their own project memberships" ON project_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Proposal templates policies
CREATE POLICY "Staff can manage proposal templates" ON proposal_templates
  FOR ALL TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

-- Proposals policies
CREATE POLICY "Staff can manage proposals in their firm" ON proposals
  FOR ALL TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Clients can view proposals for their projects" ON proposals
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'client') AND is_project_member(auth.uid(), project_id)
  );

-- Invoices policies
CREATE POLICY "Staff can manage invoices in their firm" ON invoices
  FOR ALL TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Clients can view invoices for their projects" ON invoices
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'client') AND is_project_member(auth.uid(), project_id)
  );

-- Reports policies
CREATE POLICY "Staff can manage reports in their firm" ON reports
  FOR ALL TO authenticated USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND firm_id = get_user_firm_id(auth.uid())
  );

CREATE POLICY "Clients can view reports for their projects" ON reports
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'client') AND is_project_member(auth.uid(), project_id)
  );

-- Files policies
CREATE POLICY "Staff can manage files" ON files
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Clients can view and upload files for their projects" ON files
  FOR SELECT TO authenticated USING (
    is_project_member(auth.uid(), project_id)
  );

CREATE POLICY "Clients can upload files to their projects" ON files
  FOR INSERT TO authenticated WITH CHECK (
    is_project_member(auth.uid(), project_id)
  );

-- Audit logs policies
CREATE POLICY "Staff can view audit logs in their firm" ON audit_logs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Client invitations policies
CREATE POLICY "Staff can manage invitations" ON client_invitations
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('project-files', 'report-photos', 'firm-logos'));

CREATE POLICY "Users can view files they have access to" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id IN ('project-files', 'report-photos', 'firm-logos'));

CREATE POLICY "Staff can delete files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('project-files', 'report-photos', 'firm-logos')
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  );