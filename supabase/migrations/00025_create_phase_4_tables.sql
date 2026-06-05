-- Phase 4: Gantt Chart Tasks (renamed to avoid conflict)
CREATE TABLE gantt_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_milestone BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_task_id UUID NOT NULL REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  successor_task_id UUID NOT NULL REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(predecessor_task_id, successor_task_id),
  CHECK (predecessor_task_id != successor_task_id)
);

CREATE TABLE resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Phase 4: Custom Fields
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'client', 'invoice')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'checkbox', 'file_upload')),
  field_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '[]',
  conditional_visibility JSONB,
  field_group_id UUID,
  dropdown_options TEXT[],
  default_value TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, entity_type, field_name)
);

CREATE TABLE field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'client', 'invoice')),
  group_name TEXT NOT NULL,
  group_order INTEGER NOT NULL DEFAULT 0,
  is_collapsible BOOLEAN DEFAULT true,
  is_collapsed_by_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, entity_type, group_name)
);

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'client', 'invoice')),
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_id, entity_id)
);

-- Phase 4: Report Scheduling
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('time_tracking', 'revenue', 'project_status', 'client_activity')),
  template_content TEXT NOT NULL,
  styles TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, report_type, template_name)
);

CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('time_tracking', 'revenue', 'project_status', 'client_activity')),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE RESTRICT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER CHECK (schedule_day BETWEEN 1 AND 31),
  schedule_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  recipients JSONB NOT NULL,
  report_filters JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT now(),
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  recipients JSONB NOT NULL,
  email_status TEXT NOT NULL CHECK (email_status IN ('sent', 'failed')),
  error_message TEXT
);

-- Phase 4: Calendar Integration
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  sync_direction TEXT DEFAULT 'two_way' CHECK (sync_direction IN ('one_way', 'two_way')),
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  event_type TEXT DEFAULT 'other' CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'task', 'other')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES gantt_tasks(id) ON DELETE SET NULL,
  google_event_id TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_gantt_tasks_project ON gantt_tasks(project_id);
CREATE INDEX idx_gantt_tasks_assignee ON gantt_tasks(assignee_id);
CREATE INDEX idx_gantt_tasks_dates ON gantt_tasks(start_date, end_date);
CREATE INDEX idx_task_deps_predecessor ON task_dependencies(predecessor_task_id);
CREATE INDEX idx_task_deps_successor ON task_dependencies(successor_task_id);
CREATE INDEX idx_resource_alloc_user ON resource_allocations(user_id);
CREATE INDEX idx_resource_alloc_dates ON resource_allocations(start_date, end_date);
CREATE INDEX idx_custom_fields_firm ON custom_fields(firm_id);
CREATE INDEX idx_custom_fields_entity ON custom_fields(entity_type);
CREATE INDEX idx_field_groups_firm ON field_groups(firm_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_scheduled_reports_firm ON scheduled_reports(firm_id);
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_templates_firm ON report_templates(firm_id);
CREATE INDEX idx_report_history_scheduled ON report_history(scheduled_report_id);
CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_google ON calendar_events(google_event_id);

-- RLS Policies
ALTER TABLE gantt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Gantt tasks policies
CREATE POLICY "Users can view gantt tasks in their firm projects" ON gantt_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE p.id = gantt_tasks.project_id
      AND pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create gantt tasks in their firm projects" ON gantt_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE p.id = gantt_tasks.project_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can update gantt tasks in their firm projects" ON gantt_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE p.id = gantt_tasks.project_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can delete gantt tasks in their firm projects" ON gantt_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE p.id = gantt_tasks.project_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

-- Task dependencies policies
CREATE POLICY "Users can view task dependencies" ON task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gantt_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE t.id = task_dependencies.predecessor_task_id
      AND pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage task dependencies" ON task_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gantt_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE t.id = task_dependencies.predecessor_task_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

-- Resource allocations policies
CREATE POLICY "Users can view resource allocations" ON resource_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gantt_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE t.id = resource_allocations.task_id
      AND pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage resource allocations" ON resource_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gantt_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN firms f ON p.firm_id = f.id
      JOIN profiles pr ON pr.firm_id = f.id
      WHERE t.id = resource_allocations.task_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

-- Custom fields policies
CREATE POLICY "Users can view custom fields in their firm" ON custom_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = custom_fields.firm_id
    )
  );

CREATE POLICY "Admins can manage custom fields" ON custom_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = custom_fields.firm_id
      AND profiles.role = 'admin'
    )
  );

-- Field groups policies
CREATE POLICY "Users can view field groups in their firm" ON field_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = field_groups.firm_id
    )
  );

CREATE POLICY "Admins can manage field groups" ON field_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = field_groups.firm_id
      AND profiles.role = 'admin'
    )
  );

-- Custom field values policies
CREATE POLICY "Users can view custom field values" ON custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      JOIN profiles pr ON pr.firm_id = cf.firm_id
      WHERE cf.id = custom_field_values.field_id
      AND pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage custom field values" ON custom_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      JOIN profiles pr ON pr.firm_id = cf.firm_id
      WHERE cf.id = custom_field_values.field_id
      AND pr.id = auth.uid()
      AND pr.role IN ('admin', 'staff')
    )
  );

-- Report templates policies
CREATE POLICY "Users can view report templates in their firm" ON report_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = report_templates.firm_id
    )
  );

CREATE POLICY "Admins can manage report templates" ON report_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = report_templates.firm_id
      AND profiles.role = 'admin'
    )
  );

-- Scheduled reports policies
CREATE POLICY "Users can view scheduled reports in their firm" ON scheduled_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = scheduled_reports.firm_id
    )
  );

CREATE POLICY "Users can manage scheduled reports" ON scheduled_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = scheduled_reports.firm_id
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Report history policies
CREATE POLICY "Users can view report history" ON report_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scheduled_reports sr
      JOIN profiles pr ON pr.firm_id = sr.firm_id
      WHERE sr.id = report_history.scheduled_report_id
      AND pr.id = auth.uid()
    )
  );

-- Calendar connections policies
CREATE POLICY "Users can manage their own calendar connections" ON calendar_connections
  FOR ALL USING (user_id = auth.uid());

-- Calendar events policies
CREATE POLICY "Users can view calendar events in their firm" ON calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.firm_id = calendar_events.firm_id
    )
  );

CREATE POLICY "Users can manage their own calendar events" ON calendar_events
  FOR ALL USING (user_id = auth.uid());