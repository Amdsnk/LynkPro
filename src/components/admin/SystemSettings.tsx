import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Loader2, Settings } from 'lucide-react';

interface SystemSettingsData {
  default_payment_terms: string;
  default_tax_rate: string;
  invoice_due_days: string;
  currency_symbol: string;
}

export function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<SystemSettingsData>({
    defaultValues: {
      default_payment_terms: '30',
      default_tax_rate: '0',
      invoice_due_days: '30',
      currency_symbol: '$',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real app, you'd fetch from a settings table
      // For now, we'll use localStorage as a simple solution
      const savedSettings = localStorage.getItem('system_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        form.reset(settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SystemSettingsData) => {
    setSaving(true);
    try {
      // In a real app, you'd save to a settings table
      // For now, we'll use localStorage
      localStorage.setItem('system_settings', JSON.stringify(data));
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="content-spacing">
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-xl">System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="form-spacing">
              <FormField
                control={form.control}
                name="default_payment_terms"
                rules={{ required: 'Payment terms are required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Payment Terms (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Default number of days for payment terms on invoices
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_due_days"
                rules={{ required: 'Invoice due days are required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Due Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Default number of days until invoice is due
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_tax_rate"
                rules={{ required: 'Tax rate is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Default tax rate percentage (e.g., 8.5 for 8.5%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency_symbol"
                rules={{ required: 'Currency symbol is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Symbol</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="$"
                        maxLength={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Currency symbol to display (e.g., $, €, £)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
