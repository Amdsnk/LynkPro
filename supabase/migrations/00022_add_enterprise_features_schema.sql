-- =====================================================
-- ENTERPRISE FEATURES SCHEMA
-- Tasks, Comments, Notifications, Versioning, Approvals
-- =====================================================

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_firm_id ON tasks(firm_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Enable Realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'proposal', 'invoice', 'report', 'task')),
  entity_id uuid NOT NULL,
  content text NOT NULL,
  mentions uuid[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_firm_id ON comments(firm_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_created_by ON comments(created_by);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);

-- Enable Realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('task_assigned', 'comment_mention', 'approval_request', 'approval_response', 'invoice_paid', 'proposal_viewed', 'report_shared', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text CHECK (entity_type IN ('project', 'proposal', 'invoice', 'report', 'task', 'comment', 'approval')),
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_firm_id ON notifications(firm_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- DOCUMENT VERSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('proposal', 'invoice', 'report')),
  entity_id uuid NOT NULL,
  version_number integer NOT NULL,
  content jsonb NOT NULL,
  changes_summary text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, version_number)
);

CREATE INDEX idx_document_versions_firm_id ON document_versions(firm_id);
CREATE INDEX idx_document_versions_entity ON document_versions(entity_type, entity_id);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);

-- Enable Realtime for document_versions
ALTER PUBLICATION supabase_realtime ADD TABLE document_versions;

-- =====================================================
-- APPROVALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('proposal', 'invoice', 'report')),
  entity_id uuid NOT NULL,
  requested_from uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  comments text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_approvals_firm_id ON approvals(firm_id);
CREATE INDEX idx_approvals_entity ON approvals(entity_type, entity_id);
CREATE INDEX idx_approvals_requested_from ON approvals(requested_from);
CREATE INDEX idx_approvals_status ON approvals(status);

-- Enable Realtime for approvals
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their firm"
  ON tasks FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff can update tasks in their firm"
  ON tasks FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Staff can delete tasks in their firm"
  ON tasks FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their firm"
  ON comments FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (created_by = auth.uid());

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Document Versions RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions in their firm"
  ON document_versions FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can create document versions"
  ON document_versions FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

-- Approvals RLS
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals in their firm"
  ON approvals FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can create approval requests"
  ON approvals FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Requested users can update approvals"
  ON approvals FOR UPDATE
  USING (requested_from = auth.uid() OR requested_by = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_firm_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (firm_id, user_id, type, title, message, entity_type, entity_id)
  VALUES (p_firm_id, p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to create document version
CREATE OR REPLACE FUNCTION create_document_version(
  p_firm_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_content jsonb,
  p_changes_summary text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_version_number integer;
  v_version_id uuid;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM document_versions
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  -- Create version
  INSERT INTO document_versions (firm_id, entity_type, entity_id, version_number, content, changes_summary, created_by)
  VALUES (p_firm_id, p_entity_type, p_entity_id, v_version_number, p_content, p_changes_summary, auth.uid())
  RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp for tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create notification when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    PERFORM create_notification(
      NEW.firm_id,
      NEW.assigned_to,
      'task_assigned',
      'New Task Assigned',
      'You have been assigned to task: ' || NEW.title,
      'task',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Trigger to create notification when mentioned in comment
CREATE OR REPLACE FUNCTION notify_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user uuid;
BEGIN
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user IN ARRAY NEW.mentions
    LOOP
      PERFORM create_notification(
        NEW.firm_id,
        mentioned_user,
        'comment_mention',
        'You were mentioned',
        'You were mentioned in a comment',
        NEW.entity_type,
        NEW.entity_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_comment_mentions
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mentions();

-- Trigger to create notification when approval is requested
CREATE OR REPLACE FUNCTION notify_approval_request()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      NEW.firm_id,
      NEW.requested_from,
      'approval_request',
      'Approval Requested',
      'Your approval is requested for a ' || NEW.entity_type,
      NEW.entity_type,
      NEW.entity_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    PERFORM create_notification(
      NEW.firm_id,
      NEW.requested_by,
      'approval_response',
      'Approval ' || CASE WHEN NEW.status = 'approved' THEN 'Approved' ELSE 'Rejected' END,
      'Your approval request was ' || NEW.status,
      NEW.entity_type,
      NEW.entity_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_approval_request
  AFTER INSERT OR UPDATE ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION notify_approval_request();

COMMENT ON TABLE tasks IS 'Project tasks with assignments and due dates';
COMMENT ON TABLE comments IS 'Comments on projects, proposals, invoices, reports, and tasks';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE document_versions IS 'Version history for proposals, invoices, and reports';
COMMENT ON TABLE approvals IS 'Client approval workflows for proposals, invoices, and reports';
