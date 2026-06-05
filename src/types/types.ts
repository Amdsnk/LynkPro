// Database types
export type UserRole = 'admin' | 'staff' | 'client';
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type ProposalStatusType = ProposalStatus; // Alias for consistency
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type ReportStatus = 'draft' | 'sent';
export type ReportStatusType = ReportStatus; // Alias for consistency

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  firm_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Firm {
  id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  default_proposal_terms: string | null;
  default_invoice_terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  firm_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  internal_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface ProposalTemplate {
  id: string;
  firm_id: string;
  name: string;
  description: string | null;
  sections: Array<{ title: string; content: string }>;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Proposal {
  id: string;
  firm_id: string;
  project_id: string | null;
  client_id: string;
  proposal_number?: string | null;
  template_id?: string | null;
  title: string;
  description?: string | null;
  content?: Record<string, unknown>;
  terms?: string | null;
  valid_until?: string | null;
  line_items?: LineItem[];
  total_amount: number;
  status: ProposalStatus;
  sent_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  client?: Client;
  items?: ProposalItem[];
}

export interface Invoice {
  id: string;
  firm_id: string;
  project_id: string | null;
  client_id: string;
  invoice_number: string;
  title?: string;
  description?: string | null;
  issue_date?: string;
  line_items?: LineItem[];
  total_amount: number;
  paid_amount?: number;
  payment_status?: PaymentStatus;
  status: InvoiceStatus;
  notes: string | null;
  due_date: string;
  sent_at: string | null;
  paid_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  client?: Client;
  items?: InvoiceItem[];
}

export interface Report {
  id: string;
  firm_id: string;
  project_id: string;
  client_id?: string;
  report_number?: string | null;
  title: string;
  site_location?: string | null;
  inspection_date?: string;
  observations?: string | null;
  recommendations?: string | null;
  field_notes?: string | null;
  narrative?: string | null;
  ai_narrative?: string | null;
  summary?: string | null;
  photos: string[];
  disclaimer: string | null;
  status: ReportStatus;
  approved_at: string | null;
  approved_by: string | null;
  sent_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  client?: Client;
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface File {
  id: string;
  project_id: string;
  name: string;
  file_name?: string; // Alias for database compatibility
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type?: string; // Alias for database compatibility
  uploaded_by: string;
  version: number;
  created_at: string;
  updated_at: string;
  uploader?: Profile;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version: number;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  uploader?: Profile;
}

export interface FileShare {
  id: string;
  file_id?: string;
  share_token: string;
  created_by: string;
  shared_with_email?: string;
  expires_at?: string;
  password_hash?: string;
  permission_level: 'view' | 'download';
  custom_message?: string;
  view_count: number;
  last_accessed_at?: string;
  is_bulk: boolean;
  auto_renew: boolean;
  expiration_duration?: number;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  file?: File;
}

export interface FileShareItem {
  id: string;
  share_id: string;
  file_id: string;
  created_at: string;
  file?: File;
}

export interface ShareAccessLog {
  id: string;
  share_id: string;
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
  action: 'view' | 'download';
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  message?: string;
  formats: string[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  firm_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
}

export interface ClientInvitation {
  id: string;
  email: string;
  project_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_by: string;
  created_at: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  agree_terms: boolean;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  client_id: string;
  status: ProjectStatus;
}

export interface ProposalFormData {
  title: string;
  project_id: string;
  template_id: string | null;
  content: Record<string, unknown>;
  line_items: LineItem[];
}

export interface InvoiceFormData {
  project_id: string;
  line_items: LineItem[];
}

export interface ReportFormData {
  project_id: string;
  title: string;
  field_notes: string;
  photos: string[];
}

// Invitation types
export interface Invitation {
  id: string;
  firm_id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Proposal Item types
export interface ProposalItem {
  id: string;
  proposal_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

// Invoice Item types
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

// Payment Status type
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// =====================================================
// PHASE 3: FINANCIAL & SECURITY TYPES
// =====================================================

// Order types
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Order {
  id: string;
  firm_id: string;
  user_id: string | null;
  invoice_id: string | null;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  status: OrderStatus;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  firm_id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Profile;
  project?: Project;
  task?: Task;
}

// Recurring invoice types
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoice {
  id: string;
  firm_id: string;
  client_id: string;
  template_data: Record<string, unknown>;
  frequency: RecurringFrequency;
  next_generation_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  creator?: Profile;
}

// 2FA types
export interface TotpSecret {
  id: string;
  user_id: string;
  secret: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecoveryCode {
  id: string;
  user_id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

// =====================================================
// ENTERPRISE FEATURES TYPES
// =====================================================

// Task types
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  firm_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  project?: Project;
  assignee?: Profile;
  creator?: Profile;
}

// Comment types
export type CommentEntityType = 'project' | 'proposal' | 'invoice' | 'report' | 'task';

export interface Comment {
  id: string;
  firm_id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  content: string;
  mentions: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
}

// Notification types
export type NotificationType = 
  | 'task_assigned' 
  | 'comment_mention' 
  | 'approval_request' 
  | 'approval_response' 
  | 'invoice_paid' 
  | 'proposal_viewed' 
  | 'report_shared' 
  | 'general';

export interface Notification {
  id: string;
  firm_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: CommentEntityType | 'approval' | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

// Document Version types
export type DocumentEntityType = 'proposal' | 'invoice' | 'report';

export interface DocumentVersion {
  id: string;
  firm_id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  version_number: number;
  content: Record<string, unknown>;
  changes_summary: string | null;
  created_by: string;
  created_at: string;
  // Relations
  creator?: Profile;
}

// Approval types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Approval {
  id: string;
  firm_id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  requested_from: string;
  requested_by: string;
  status: ApprovalStatus;
  comments: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  requester?: Profile;
  approver?: Profile;
}

// Phase 4: Gantt Chart Types
export interface GanttTask {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress: number;
  assignee_id: string | null;
  is_milestone: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  created_at: string;
  updated_at: string;
  assignee?: Profile;
  dependencies?: TaskDependency[];
  resource_allocations?: ResourceAllocation[];
}

export interface TaskDependency {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag_days: number;
  created_at: string;
  predecessor_task?: GanttTask;
  successor_task?: GanttTask;
}

export interface ResourceAllocation {
  id: string;
  task_id: string;
  user_id: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  created_at: string;
  user?: Profile;
  task?: GanttTask;
}

// Phase 4: Custom Fields Types
export interface CustomField {
  id: string;
  firm_id: string;
  entity_type: 'project' | 'client' | 'invoice';
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file_upload';
  field_order: number;
  is_required: boolean;
  validation_rules: ValidationRule[];
  conditional_visibility: ConditionalRule | null;
  field_group_id: string | null;
  dropdown_options: string[] | null;
  default_value: string | null;
  help_text: string | null;
  created_at: string;
  updated_at: string;
  field_group?: FieldGroup;
}

export interface ValidationRule {
  type: 'regex' | 'min' | 'max' | 'min_length' | 'max_length' | 'email' | 'url';
  value: string | number;
  error_message: string;
}

export interface ConditionalRule {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface FieldGroup {
  id: string;
  firm_id: string;
  entity_type: 'project' | 'client' | 'invoice';
  group_name: string;
  group_order: number;
  is_collapsible: boolean;
  is_collapsed_by_default: boolean;
  created_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_id: string;
  entity_type: 'project' | 'client' | 'invoice';
  entity_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
  field?: CustomField;
}

// Phase 4: Report Scheduling Types
export interface ReportTemplate {
  id: string;
  firm_id: string;
  template_name: string;
  report_type: 'time_tracking' | 'revenue' | 'project_status' | 'client_activity';
  template_content: string;
  styles: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  firm_id: string;
  report_name: string;
  report_type: 'time_tracking' | 'revenue' | 'project_status' | 'client_activity';
  template_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule_day: number | null;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
  recipients: EmailRecipient[];
  report_filters: ReportFilters;
  last_run_at: string | null;
  next_run_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  template?: ReportTemplate;
  creator?: Profile;
}

export interface EmailRecipient {
  email: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface ReportFilters {
  date_range?: 'last_day' | 'last_week' | 'last_month' | 'custom';
  custom_start_date?: string;
  custom_end_date?: string;
  project_ids?: string[];
  client_ids?: string[];
  user_ids?: string[];
}

export interface ReportHistory {
  id: string;
  scheduled_report_id: string;
  generated_at: string;
  file_url: string;
  file_size: number;
  recipients: EmailRecipient[];
  email_status: 'sent' | 'failed';
  error_message: string | null;
  scheduled_report?: ScheduledReport;
}

// Phase 4: Calendar Integration Types
export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google';
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  calendar_name: string;
  sync_direction: 'one_way' | 'two_way';
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// INLINE COMMENTING SYSTEM TYPES
// =====================================================

export type CommentFieldName = 'field_notes' | 'narrative';

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string;
  parent_comment_id: string | null;
  field_name: CommentFieldName;
  selection_start: number;
  selection_end: number;
  selected_text: string;
  comment_text: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
  resolver?: Profile;
  replies?: ReportComment[];
  mentions?: CommentMention[];
}

export interface CommentMention {
  id: string;
  comment_id: string;
  mentioned_user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Relations
  comment?: ReportComment;
  mentioned_user?: Profile;
}

export interface CommentThread {
  rootComment: ReportComment;
  replies: ReportComment[];
  totalReplies: number;
  isResolved: boolean;
  participants: Profile[];
}

export interface CalendarEvent {
  id: string;
  firm_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  attendees: string[];
  event_type: 'meeting' | 'deadline' | 'milestone' | 'task' | 'other';
  project_id: string | null;
  task_id: string | null;
  google_event_id: string | null;
  sync_status: 'synced' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
  project?: Project;
  task?: GanttTask;
  user?: Profile;
}

// Material Tracking Types
export type MaterialUnit = 'kg' | 'ton' | 'liter' | 'm3' | 'piece' | 'box' | 'bag';
export type MaterialStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';

export interface Material {
  id: string;
  firm_id: string;
  name: string;
  description: string | null;
  unit: MaterialUnit;
  current_quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  status: MaterialStatus;
  supplier_name: string | null;
  supplier_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialDelivery {
  id: string;
  firm_id: string;
  material_id: string;
  project_id: string | null;
  supplier_name: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  delivery_date: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  material?: Material;
  project?: Project;
  receiver?: Profile;
}

export interface MaterialConsumption {
  id: string;
  firm_id: string;
  material_id: string;
  project_id: string;
  quantity: number;
  consumed_date: string;
  consumed_by: string | null;
  activity: string | null;
  notes: string | null;
  created_at: string;
  material?: Material;
  project?: Project;
  consumer?: Profile;
}

// Equipment Management Types
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection';

export interface Equipment {
  id: string;
  firm_id: string;
  name: string;
  equipment_type: string;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  status: EquipmentStatus;
  current_location: string | null;
  current_project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  current_project?: Project;
}

export interface EquipmentUsage {
  id: string;
  firm_id: string;
  equipment_id: string;
  project_id: string;
  operator_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  fuel_consumed: number | null;
  notes: string | null;
  created_at: string;
  equipment?: Equipment;
  project?: Project;
  operator?: Profile;
}

export interface EquipmentMaintenance {
  id: string;
  firm_id: string;
  equipment_id: string;
  maintenance_type: MaintenanceType;
  scheduled_date: string;
  completed_date: string | null;
  performed_by: string | null;
  cost: number | null;
  description: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  equipment?: Equipment;
  performer?: Profile;
}

// Safety Incident Types
export type IncidentType = 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'security';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InvestigationStatus = 'pending' | 'in_progress' | 'completed' | 'closed';

export interface SafetyIncident {
  id: string;
  firm_id: string;
  project_id: string;
  incident_number: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  incident_date: string;
  location: string;
  description: string;
  immediate_action: string | null;
  photos: string[];
  reported_by: string;
  investigation_status: InvestigationStatus;
  assigned_investigator: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  reporter?: Profile;
  investigator?: Profile;
  investigations?: IncidentInvestigation[];
  corrective_actions?: CorrectiveAction[];
}

export interface IncidentInvestigation {
  id: string;
  firm_id: string;
  incident_id: string;
  investigator_id: string;
  root_cause: string | null;
  contributing_factors: string | null;
  findings: string;
  investigation_date: string;
  created_at: string;
  incident?: SafetyIncident;
  investigator?: Profile;
}

export interface CorrectiveAction {
  id: string;
  firm_id: string;
  incident_id: string;
  action_description: string;
  assigned_to: string | null;
  due_date: string;
  completed_date: string | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  incident?: SafetyIncident;
  assignee?: Profile;
}

// Budget Variance Types
export type CostCategoryType = 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'overhead' | 'other';

export interface CostCategory {
  id: string;
  firm_id: string;
  project_id: string;
  name: string;
  category_type: CostCategoryType;
  budgeted_amount: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface BudgetCategory {
  id: string;
  firm_id: string;
  project_id: string;
  category_name: string;
  description: string | null;
  budgeted_amount: number;
  created_at: string;
  project?: Project;
  total_actual?: number;
  variance?: number;
  variance_percent?: number;
  status?: 'under_budget' | 'over_budget';
}

export interface ActualCost {
  id: string;
  firm_id: string;
  project_id: string;
  cost_category_id: string;
  amount: number;
  cost_date: string;
  description: string;
  vendor: string | null;
  invoice_number?: string | null;
  recorded_by: string;
  notes?: string | null;
  created_at: string;
  project?: Project;
  category?: BudgetCategory;
  cost_category?: CostCategory;
  recorded_by_user?: Profile;
  recorder?: Profile;
  // Legacy fields (deprecated)
  category_id?: string;
  vendor_name?: string | null;
}

export interface BudgetVariance {
  category_id: string;
  firm_id: string;
  project_id: string;
  category_name: string;
  category_type: CostCategoryType;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  utilization_percentage: number;
  status: 'over_budget' | 'near_budget' | 'within_budget';
}

// Photo Documentation Types
export type PhotoType = 'progress' | 'before' | 'after' | 'issue' | 'completion' | 'other';

export interface ProjectPhoto {
  id: string;
  firm_id: string;
  project_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  photo_url: string;
  photo_type: PhotoType;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  taken_at: string | null;
  uploaded_at: string;
  tags: string[] | null;
  created_at: string;
}

// Permit Types
export type PermitStatus = 'pending' | 'approved' | 'expired' | 'renewed' | 'rejected';

export interface Permit {
  id: string;
  firm_id: string;
  project_id: string;
  permit_number: string;
  permit_type: string;
  permit_name: string;
  issuing_authority: string;
  issue_date: string;
  expiration_date: string;
  status: PermitStatus;
  document_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Subcontractor Types
export type SubcontractorStatus = 'active' | 'inactive' | 'blacklisted';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Subcontractor {
  id: string;
  firm_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string | null;
  specialty: string;
  license_number: string | null;
  insurance_expiry: string | null;
  rating: number | null;
  status: SubcontractorStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubcontractorAssignment {
  id: string;
  firm_id: string;
  project_id: string;
  subcontractor_id: string;
  task_description: string;
  start_date: string;
  end_date: string | null;
  contract_amount: number;
  paid_amount: number;
  status: AssignmentStatus;
  performance_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Purchase Requisition Types
export type RequisitionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseRequisition {
  id: string;
  firm_id: string;
  project_id: string;
  requisition_number: string;
  requested_by: string;
  material_name: string;
  quantity: number;
  unit: string;
  estimated_cost: number;
  vendor_name: string | null;
  required_by: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// QR Code Types
export type AssetType = 'material' | 'equipment' | 'tool' | 'vehicle';
export type ScanType = 'check_in' | 'check_out' | 'inspection' | 'maintenance' | 'transfer' | 'view';

export interface AssetQRCode {
  id: string;
  firm_id: string;
  asset_type: AssetType;
  asset_id: string;
  qr_code_data: string;
  generated_at: string;
  last_scanned_at: string | null;
  scan_count: number;
  created_at: string;
}

export interface QRScanHistory {
  id: string;
  firm_id: string;
  qr_code_id: string;
  scanned_by: string;
  scan_type: ScanType;
  project_id: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  scanned_at: string;
}

// Phase 1: Field Operations Types

// Daily Site Reports
export interface DailySiteReport {
  id: string;
  firm_id: string;
  project_id: string;
  report_date: string; // ISO date string
  weather_condition?: string;
  temperature_high?: number;
  temperature_low?: number;
  workforce_count?: WorkforceCount;
  work_completed?: string;
  materials_received?: MaterialReceived[];
  equipment_on_site?: EquipmentOnSite[];
  visitors?: Visitor[];
  issues?: string;
  delays?: string;
  safety_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkforceCount {
  [trade: string]: number; // e.g., { carpenter: 5, electrician: 3 }
}

export interface MaterialReceived {
  material: string;
  quantity: number;
  unit: string;
  supplier?: string;
  notes?: string;
}

export interface EquipmentOnSite {
  equipment: string;
  count: number;
  condition?: string;
  notes?: string;
}

export interface Visitor {
  name: string;
  company: string;
  purpose: string;
  time_in?: string;
  time_out?: string;
}

// Field Issues & RFIs
export type IssueType = 'rfi' | 'deficiency' | 'safety' | 'quality' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface FieldIssue {
  id: string;
  firm_id: string;
  project_id: string;
  issue_number: string;
  title: string;
  description?: string;
  issue_type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  location?: string;
  assigned_to?: string;
  reported_by: string;
  photo_urls?: string[];
  due_date?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueResponse {
  id: string;
  issue_id: string;
  response_text: string;
  responded_by: string;
  attachments?: string[];
  created_at: string;
}

// Quality Inspections
export type InspectionStatus = 'pass' | 'fail' | 'conditional';
export type ItemStatus = 'pass' | 'fail' | 'na';

export interface InspectionTemplate {
  id: string;
  firm_id: string;
  name: string;
  trade?: string;
  description?: string;
  checklist_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  item: string;
  required: boolean;
  pass_criteria?: string;
}

export interface QualityInspection {
  id: string;
  firm_id: string;
  project_id: string;
  template_id?: string;
  inspection_date: string;
  inspector_id: string;
  location?: string;
  results: InspectionResult[];
  overall_status: InspectionStatus;
  signature_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionResult {
  item: string;
  status: ItemStatus;
  notes?: string;
  photos?: string[];
}

// Phase 2: Workforce & Subcontractor Management Types

// Worker Skills
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface WorkerSkill {
  id: string;
  firm_id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  certifications?: Certification[];
  years_experience: number;
  last_used?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certificate_number?: string;
}

// Task Assignments
export type TaskAssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskAssignment {
  id: string;
  firm_id: string;
  project_id: string;
  task_name: string;
  description?: string;
  required_skills?: RequiredSkill[];
  assigned_to: string[];
  start_date?: string;
  end_date?: string;
  status: TaskAssignmentStatus;
  completion_percentage: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RequiredSkill {
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  required: boolean;
}

// Productivity Metrics
export interface ProductivityMetric {
  id: string;
  firm_id: string;
  project_id: string;
  date: string;
  trade?: string;
  crew_id?: string;
  hours_worked: number;
  units_completed: number;
  unit_type?: string;
  productivity_rate: number;
  weather_condition?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Phase 3: Material Procurement & Supply Chain Types
export interface MaterialConsumption {
  id: string;
  firm_id: string;
  project_id: string;
  material_id: string;
  quantity_used: number;
  unit: string;
  date_used: string;
  project_phase?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialForecast {
  id: string;
  firm_id: string;
  project_id: string;
  material_id: string;
  forecast_date: string;
  predicted_quantity: number;
  confidence_level?: number;
  lead_time_days?: number;
  reorder_point?: number;
  created_at: string;
  updated_at: string;
}

export type VendorStatus = 'active' | 'inactive' | 'suspended';

export interface Vendor {
  id: string;
  firm_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  on_time_delivery_rate?: number;
  average_lead_time_days?: number;
  status: VendorStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPerformance {
  id: string;
  vendor_id: string;
  order_id?: string;
  delivery_date?: string;
  promised_date?: string;
  on_time?: boolean;
  quality_rating?: number;
  notes?: string;
  created_at: string;
}

export interface PurchaseRequisition {
  id: string;
  firm_id: string;
  project_id: string;
  requisition_number: string;
  requested_by: string;
  status: RequisitionStatus;
  items: Array<{
    material_id: string;
    quantity: number;
    unit: string;
    estimated_cost?: number;
  }>;
  total_estimated_cost?: number;
  vendor_id?: string;
  approval_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Phase 4: Safety & Compliance Types

// Safety Audit Templates
export interface SafetyAuditTemplate {
  id: string;
  firm_id: string;
  name: string;
  regulation: string | null;
  checklist_items: ChecklistItem[];
  frequency: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  question: string;
  category?: string;
  required: boolean;
  type: 'yes_no' | 'text' | 'photo' | 'rating';
}

// Safety Audits
export interface SafetyAudit {
  id: string;
  firm_id: string;
  project_id: string;
  template_id: string | null;
  audit_date: string;
  auditor_id: string;
  results: AuditResult[];
  overall_score: number | null;
  corrective_actions: CorrectiveAction[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditResult {
  item_id: string;
  question: string;
  response: string | boolean | number;
  passed: boolean;
  notes?: string;
  photo_urls?: string[];
}

export interface CorrectiveAction {
  id: string;
  issue: string;
  action_required: string;
  assigned_to?: string;
  due_date?: string;
  status: 'open' | 'in_progress' | 'completed';
  completed_date?: string;
}

// Compliance Requirements
export interface ComplianceRequirement {
  id: string;
  firm_id: string;
  project_type: string | null;
  requirement_name: string;
  description: string | null;
  regulation_reference: string | null;
  frequency: string | null;
  responsible_party: string | null;
  created_at: string;
  updated_at: string;
}

// Compliance Tracking
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending';

export interface ComplianceTracking {
  id: string;
  firm_id: string;
  project_id: string;
  requirement_id: string;
  status: ComplianceStatus;
  last_checked: string | null;
  next_check_due: string | null;
  evidence_urls: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Risk Assessments
export interface RiskAssessment {
  id: string;
  firm_id: string;
  project_id: string;
  activity: string;
  location: string | null;
  risk_score: number | null;
  risk_factors: RiskFactors;
  mitigation_measures: MitigationMeasure[];
  assessed_by: string;
  assessment_date: string;
  created_at: string;
  updated_at: string;
}

export interface RiskFactors {
  height?: number;
  weather?: number;
  equipment?: number;
  experience?: number;
  complexity?: number;
  [key: string]: number | undefined;
}

export interface MitigationMeasure {
  id: string;
  measure: string;
  implemented: boolean;
  responsible_party?: string;
}

// Risk Predictions
export interface RiskPrediction {
  id: string;
  firm_id: string;
  project_id: string;
  prediction_date: string;
  high_risk_activities: HighRiskActivity[];
  predicted_risk_score: number | null;
  confidence_level: number | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
}

export interface HighRiskActivity {
  activity: string;
  risk_score: number;
  factors: string[];
}

// Phase 5: AI-Powered Intelligence Types

export type ModelType = 'delay_prediction' | 'budget_forecast' | 'safety_risk' | 'material_demand' | 'issue_detection';
export type PredictionType = 'delay' | 'budget_overrun' | 'material_demand' | 'safety_risk' | 'issue_detection';

export interface MLModel {
  id: string;
  firm_id: string;
  model_name: string;
  model_type: ModelType;
  version: string;
  training_data_range: string | null;
  accuracy_metrics: Record<string, number> | null;
  deployed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MLPrediction {
  id: string;
  model_id: string | null;
  firm_id: string;
  project_id: string | null;
  prediction_type: PredictionType;
  prediction_data: Record<string, any>;
  confidence_score: number | null;
  actual_outcome: Record<string, any> | null;
  feedback_score: number | null;
  created_at: string;
  expires_at: string | null;
}

// Delay Prediction Types
export interface DelayPrediction {
  project_id: string;
  project_name: string;
  predicted_delay_days: number;
  delay_probability: number;
  predicted_completion_date: string;
  original_completion_date: string;
  root_causes: DelayRootCause[];
  mitigation_recommendations: string[];
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface DelayRootCause {
  category: 'weather' | 'materials' | 'workforce' | 'equipment' | 'dependencies' | 'other';
  description: string;
  impact_days: number;
  probability: number;
}

// Budget Prediction Types
export interface BudgetPrediction {
  project_id: string;
  project_name: string;
  current_budget: number;
  current_spent: number;
  predicted_final_cost: number;
  predicted_variance: number;
  variance_percentage: number;
  overrun_probability: number;
  cost_breakdown: CostBreakdown[];
  savings_opportunities: SavingsOpportunity[];
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface CostBreakdown {
  category: string;
  budgeted: number;
  spent: number;
  predicted: number;
  variance: number;
}

export interface SavingsOpportunity {
  category: string;
  description: string;
  potential_savings: number;
  effort_level: 'low' | 'medium' | 'high';
  priority: number;
}

// Material Demand Prediction Types
export interface MaterialDemandPrediction {
  material_id: string;
  material_name: string;
  current_stock: number;
  predicted_demand: number[];
  predicted_dates: string[];
  reorder_point: number;
  optimal_order_quantity: number;
  lead_time_days: number;
  stockout_risk: number;
  waste_risk: number;
  confidence_score: number;
}

// Issue Detection Types
export interface DetectedIssue {
  id: string;
  photo_url: string;
  issue_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string | null;
  bounding_box: BoundingBox | null;
  confidence_score: number;
  recommended_actions: string[];
  detected_at: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// AI Analysis Types
export interface AIAnalysisResult {
  analysis_id: string;
  analysis_type: string;
  input_data: Record<string, any>;
  results: Record<string, any>;
  confidence_score: number;
  processing_time_ms: number;
  created_at: string;
}

// Phase 6: Advanced Features & Integrations Types

// BIM Model Types
export interface BIMModel {
  id: string;
  firm_id: string;
  project_id: string;
  model_name: string;
  file_url: string;
  file_size: number | null;
  upload_date: string;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export interface BIMIssue {
  id: string;
  model_id: string | null;
  issue_id: string | null;
  firm_id: string;
  model_coordinates: ModelCoordinates | null;
  element_id: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

export interface ModelCoordinates {
  x: number;
  y: number;
  z: number;
}

// Change Order Types
export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

export interface ChangeOrder {
  id: string;
  firm_id: string;
  project_id: string;
  co_number: string;
  title: string;
  description: string | null;
  requested_by: string;
  request_date: string;
  reason: string | null;
  cost_impact: number | null;
  schedule_impact_days: number | null;
  status: ChangeOrderStatus;
  approved_by: string | null;
  approval_date: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

// Geofencing Types
export interface Geofence {
  id: string;
  firm_id: string;
  project_id: string | null;
  name: string;
  coordinates: GeoCoordinates;
  radius_meters: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeoCoordinates {
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][];
}

export interface LocationHistory {
  id: string;
  user_id: string;
  firm_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  timestamp: string;
  geofence_id: string | null;
  created_at: string;
}

// Portal Access Types
export type PortalType = 'client' | 'subcontractor';

export interface PortalAccess {
  id: string;
  user_id: string;
  firm_id: string;
  portal_type: PortalType;
  project_ids: string[] | null;
  permissions: Record<string, boolean> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// IoT Types
export type DeviceType = 'gps_tracker' | 'temp_sensor' | 'fuel_monitor' | 'humidity_sensor' | 'air_quality_sensor' | 'concrete_sensor';
export type DeviceStatus = 'active' | 'inactive' | 'error' | 'maintenance';

export interface IoTDevice {
  id: string;
  firm_id: string;
  device_id: string;
  device_type: DeviceType;
  device_name: string | null;
  project_id: string | null;
  equipment_id: string | null;
  status: DeviceStatus;
  last_reading_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  device_id: string;
  firm_id: string;
  reading_type: string;
  value: number | null;
  unit: string | null;
  timestamp: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Dashboard Types
export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}
