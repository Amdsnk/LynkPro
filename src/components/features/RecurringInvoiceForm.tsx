import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format, addDays, addMonths, addYears } from 'date-fns';
import { toast } from 'sonner';
import type { Client, RecurringFrequency } from '@/types/types';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export function RecurringInvoiceForm() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.firm_id) {
      fetchClients();
    }
  }, [profile?.firm_id]);

  const fetchClients = async () => {
    if (!profile?.firm_id) return;
    const { data } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('firm_id', profile.firm_id)
      .order('name');
    if (data) setClients(data as any);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const getNextDates = () => {
    const dates = [startDate];
    for (let i = 1; i < 3; i++) {
      const lastDate = dates[dates.length - 1];
      let nextDate: Date;
      switch (frequency) {
        case 'weekly':
          nextDate = addDays(lastDate, 7);
          break;
        case 'monthly':
          nextDate = addMonths(lastDate, 1);
          break;
        case 'quarterly':
          nextDate = addMonths(lastDate, 3);
          break;
        case 'yearly':
          nextDate = addYears(lastDate, 1);
          break;
      }
      dates.push(nextDate);
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!selectedClient || items.length === 0 || !profile?.firm_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        items: items.filter(item => item.description && item.rate > 0),
        total_amount: calculateTotal(),
        terms: 'Net 30',
      };

      const { error } = await supabase.from('recurring_invoices').insert({
        firm_id: profile.firm_id,
        client_id: selectedClient,
        template_data: templateData,
        frequency,
        next_generation_date: format(startDate, 'yyyy-MM-dd'),
        is_active: true,
        created_by: profile.id,
      });

      if (error) throw error;

      toast.success('Recurring invoice created successfully');
      
      // Reset form
      setSelectedClient('');
      setItems([{ description: '', quantity: 1, rate: 0 }]);
      setStartDate(new Date());
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      toast.error('Failed to create recurring invoice');
    } finally {
      setSaving(false);
    }
  };

  const nextDates = getNextDates();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Recurring Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Selection */}
        <div>
          <Label>Client *</Label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div>
          <Label>Frequency *</Label>
          <Select value={frequency} onValueChange={(v: RecurringFrequency) => setFrequency(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div>
          <Label>First Invoice Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Invoice Items *</Label>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <span className="text-sm text-muted-foreground">Total: </span>
            <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Preview Next Dates */}
        <div className="border-t pt-4">
          <Label className="mb-2 block">Next 3 Invoice Dates</Label>
          <div className="space-y-1">
            {nextDates.map((date, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {index + 1}. {format(date, 'PPP')}
              </p>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? 'Creating...' : 'Create Recurring Invoice'}
        </Button>
      </CardContent>
    </Card>
  );
}
