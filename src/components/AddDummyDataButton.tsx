import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

export function AddDummyDataButton() {
  const [loading, setLoading] = useState(false);

  const handleAddDummyData = async () => {
    if (!confirm('This will add sample data to demonstrate the application. Continue?')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc('add_dummy_analytics_data');

      if (error) throw error;

      toast.success('Dummy data added successfully! Refresh the page to see the data.');
    } catch (error: any) {
      console.error('Error adding dummy data:', error);
      if (error.message?.includes('already exists')) {
        toast.error('Dummy data already exists');
      } else {
        toast.error('Failed to add dummy data: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddDummyData}
      disabled={loading}
      className="transition-smooth"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding Data...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Add Demo Data
        </>
      )}
    </Button>
  );
}
