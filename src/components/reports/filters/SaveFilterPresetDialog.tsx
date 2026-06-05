import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SaveFilterPresetDialogProps {
  filterConfig: Record<string, unknown>;
  reportType: string;
  onSaved?: () => void;
}

export default function SaveFilterPresetDialog({
  filterConfig,
  reportType,
  onSaved,
}: SaveFilterPresetDialogProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    if (!profile?.firm_id) {
      toast.error('User profile not found');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('filter_presets').insert({
        name: name.trim(),
        description: description.trim() || null,
        filter_config: filterConfig,
        report_type: reportType,
        is_shared: isShared,
        created_by: profile.id,
        firm_id: profile.firm_id,
      });

      if (error) throw error;

      toast.success('Filter preset saved successfully');
      setOpen(false);
      setName('');
      setDescription('');
      setIsShared(false);
      onSaved?.();
    } catch (error) {
      console.error('Error saving filter preset:', error);
      toast.error('Failed to save filter preset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="mr-2 h-4 w-4" />
          Save Preset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filter configuration for quick access later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Preset Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2024 Materials Report"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help identify this preset"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="shared"
              checked={isShared}
              onCheckedChange={(checked) => setIsShared(checked as boolean)}
            />
            <Label htmlFor="shared" className="font-normal cursor-pointer">
              Share with team members
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
