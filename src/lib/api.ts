import { supabase } from '@/db/supabase';
import type { 
  Client, 
  Project, 
  Proposal, 
  Invoice, 
  Report, 
  File as ProjectFile,
  AuditLog,
  Profile,
  ProposalTemplate,
  Firm,
  Invitation,
  ProposalItem,
  InvoiceItem
} from '@/types/types';

// Client operations
export async function getClients(firmId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Client[];
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Client | null;
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Project operations
export async function getProjects(firmId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Project | null;
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// Proposal operations
export async function getProposals(firmId: string) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, project:projects(*), client:clients(*)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Proposal[];
}

// Alias for consistency
export const getProposalsByFirm = getProposals;

export async function getProposal(id: string) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*, project:projects(*), client:clients(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Proposal | null;
}

export async function createProposal(proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at' | 'project' | 'client' | 'items'>) {
  const { data, error } = await supabase
    .from('proposals')
    .insert(proposal)
    .select()
    .single();

  if (error) throw error;
  return data as Proposal;
}

export async function updateProposal(id: string, updates: Partial<Proposal>) {
  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Proposal;
}

// Invoice operations
export async function getInvoices(firmId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, project:projects(*), client:clients(*)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Invoice[];
}

// Alias for consistency
export const getInvoicesByFirm = getInvoices;

export async function getInvoice(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, project:projects(*), client:clients(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Invoice | null;
}

export async function createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'project' | 'client' | 'items'>) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();

  if (error) throw error;
  return data as Invoice;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Invoice;
}

// Report operations
export async function getReports(firmId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, project:projects(*)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Report[];
}

// Alias for consistency
export const getReportsByFirm = getReports;

export async function getReport(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, project:projects(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Report | null;
}

export async function createReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'project'>) {
  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

export async function updateReport(id: string, updates: Partial<Report>) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

// Firm operations
export async function getFirm(firmId: string) {
  const { data, error } = await supabase
    .from('firms')
    .select('*')
    .eq('id', firmId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateFirm(firmId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('firms')
    .update(updates)
    .eq('id', firmId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// File operations
export async function getProjectFiles(projectId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ProjectFile[];
}

// User operations
export async function getUsers(firmId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// AI text generation
export async function generateAIText(type: 'invoice_description' | 'report_narrative', input: string, context?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('generate-ai-text', {
    body: { type, input, context },
  });

  if (error) throw error;
  return data.text as string;
}

// Email sending
export async function sendEmail(to: string, subject: string, html: string, entityType: string, entityId: string) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html, entityType, entityId },
  });

  if (error) throw error;
  return data;
}

// Proposal Template operations
export async function getProposalTemplates() {
  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ProposalTemplate[];
}

export async function getProposalTemplate(id: string) {
  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ProposalTemplate;
}

export async function createProposalTemplate(template: Omit<ProposalTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('proposal_templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data as ProposalTemplate;
}

export async function updateProposalTemplate(id: string, template: Partial<Omit<ProposalTemplate, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('proposal_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProposalTemplate;
}

export async function deleteProposalTemplate(id: string) {
  const { error } = await supabase
    .from('proposal_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Invitation API
export async function getInvitations(firmId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Invitation[];
}

export async function createInvitation(invitation: { firm_id: string; email: string }) {
  const { data, error } = await supabase
    .from('invitations')
    .insert(invitation)
    .select()
    .single();

  if (error) throw error;
  return data as Invitation;
}

export async function getInvitationByToken(token: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  return data as Invitation | null;
}

export async function acceptInvitation(token: string) {
  const { data, error } = await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)
    .select()
    .single();

  if (error) throw error;
  return data as Invitation;
}

export async function deleteInvitation(id: string) {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Proposal Items API
export async function createProposalItems(items: Partial<ProposalItem>[]) {
  const { data, error} = await supabase
    .from('proposal_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data as ProposalItem[];
}

export async function deleteProposalItems(proposalId: string) {
  const { error } = await supabase
    .from('proposal_items')
    .delete()
    .eq('proposal_id', proposalId);

  if (error) throw error;
}

// Invoice Items API
export async function generateInvoiceNumber(firmId: string) {
  const { data, error } = await supabase.rpc('generate_invoice_number', {
    p_firm_id: firmId,
  });

  if (error) throw error;
  return data as string;
}

export async function createInvoiceItems(items: Partial<InvoiceItem>[]) {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data as InvoiceItem[];
}

export async function deleteInvoiceItems(invoiceId: string) {
  const { error } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (error) throw error;
}

// Audit Log API
export async function getAuditLogs(firmId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AuditLog[];
}

export async function logAuditEvent(
  firmId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  const { data, error } = await supabase.rpc('log_audit_event', {
    p_firm_id: firmId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_old_values: oldValues || null,
    p_new_values: newValues || null,
  });

  if (error) throw error;
  return data as string;
}

// Wrapper for backward compatibility
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
  const { error } = await supabase
    .from('audit_logs')
    .insert(log);

  if (error) throw error;
}
