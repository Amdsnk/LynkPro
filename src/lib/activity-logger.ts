import { supabase } from '@/db/supabase';

export type EntityType = 'project' | 'client' | 'invoice' | 'proposal' | 'report' | 'user' | 'firm';
export type ActionType = 'created' | 'updated' | 'deleted' | 'sent' | 'paid' | 'accepted' | 'rejected' | 'archived';

interface LogActivityParams {
  firmId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  entityName?: string;
  changes?: Record<string, { from: any; to: any }>;
}

export async function logActivity({
  firmId,
  userId,
  entityType,
  entityId,
  action,
  entityName,
  changes,
}: LogActivityParams) {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      firm_id: firmId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      entity_name: entityName,
      changes: changes || null,
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

// Helper to track field changes
export function trackChanges<T extends Record<string, any>>(
  oldData: T,
  newData: T,
  fields: (keyof T)[]
): Record<string, { from: any; to: any }> | undefined {
  const changes: Record<string, { from: any; to: any }> = {};

  fields.forEach((field) => {
    const oldValue = oldData[field];
    const newValue = newData[field];

    if (oldValue !== newValue) {
      changes[String(field)] = {
        from: oldValue,
        to: newValue,
      };
    }
  });

  return Object.keys(changes).length > 0 ? changes : undefined;
}
