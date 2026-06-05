/**
 * Export history logging utility
 */
import { supabase } from '@/db/supabase';
import type { FilterMetadata } from '@/types/filterMetadata';

export interface ExportLogData {
  reportType: string;
  reportName: string;
  exportFormat: 'CSV' | 'Excel' | 'PDF';
  filterMetadata?: FilterMetadata;
}

/**
 * Log an export event to the export_history table
 */
export async function logExport(data: ExportLogData): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No user found, skipping export log');
      return;
    }

    // Get user profile for firm_id and name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('firm_id, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching profile for export log:', profileError);
      return;
    }

    const userName = `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User';

    // Insert export history record
    const { error: insertError } = await supabase
      .from('export_history')
      .insert({
        firm_id: profile.firm_id,
        user_id: user.id,
        user_name: userName,
        report_type: data.reportType,
        report_name: data.reportName,
        export_format: data.exportFormat,
        filter_config: data.filterMetadata || null,
        exported_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error logging export:', insertError);
    }
  } catch (error) {
    console.error('Unexpected error logging export:', error);
  }
}
