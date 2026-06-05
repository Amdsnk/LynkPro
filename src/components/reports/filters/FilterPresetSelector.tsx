import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Users, User } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FilterPreset {
  id: string;
  name: string;
  description: string | null;
  filter_config: Record<string, unknown>;
  is_shared: boolean;
  created_by: string;
}

interface FilterPresetSelectorProps {
  reportType: string;
  onPresetApply: (config: Record<string, unknown>) => void;
  refreshTrigger?: number;
}

export default function FilterPresetSelector({
  reportType,
  onPresetApply,
  refreshTrigger,
}: FilterPresetSelectorProps) {
  const { profile } = useAuth();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, [profile, reportType, refreshTrigger]);

  const fetchPresets = async () => {
    if (!profile?.firm_id) return;

    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .eq('report_type', reportType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error('Error fetching filter presets:', error);
      toast.error('Failed to load filter presets');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onPresetApply(preset.filter_config);
      setSelectedPresetId(presetId);
      toast.success(`Applied preset: ${preset.name}`);
    }
  };

  const handleDeletePreset = async () => {
    if (!presetToDelete) return;

    try {
      const { error } = await supabase
        .from('filter_presets')
        .delete()
        .eq('id', presetToDelete);

      if (error) throw error;

      toast.success('Filter preset deleted');
      setPresets(presets.filter(p => p.id !== presetToDelete));
      if (selectedPresetId === presetToDelete) {
        setSelectedPresetId('');
      }
    } catch (error) {
      console.error('Error deleting filter preset:', error);
      toast.error('Failed to delete filter preset');
    } finally {
      setDeleteDialogOpen(false);
      setPresetToDelete(null);
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const canDelete = selectedPreset && selectedPreset.created_by === profile?.id;

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Load Saved Preset</label>
        <div className="flex gap-2">
          <Select
            value={selectedPresetId}
            onValueChange={handleApplyPreset}
            disabled={loading || presets.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue
                placeholder={
                  loading
                    ? 'Loading presets...'
                    : presets.length === 0
                    ? 'No saved presets'
                    : 'Select a preset'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    {preset.is_shared ? (
                      <Users className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>{preset.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canDelete && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setPresetToDelete(selectedPresetId);
                setDeleteDialogOpen(true);
              }}
              title="Delete preset"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedPreset?.description && (
          <p className="text-xs text-muted-foreground">
            {selectedPreset.description}
          </p>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filter Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this filter preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
