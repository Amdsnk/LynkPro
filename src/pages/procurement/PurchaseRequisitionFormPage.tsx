import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseRequisitionFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([{ material_id: '', quantity: 1, unit: '', estimated_cost: 0 }]);

  function addItem() {
    setItems([...items, { material_id: '', quantity: 1, unit: '', estimated_cost: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) throw new Error('Firm not found');

      const totalCost = items.reduce((sum, item) => sum + (item.estimated_cost * item.quantity), 0);
      const reqNumber = `REQ-${Date.now()}`;

      const { error } = await supabase
        .from('purchase_requisitions')
        .insert([{
          firm_id: profile.firm_id,
          project_id: projectId,
          requisition_number: reqNumber,
          requested_by: user.id,
          status: 'draft',
          items,
          total_estimated_cost: totalCost,
        }]);

      if (error) throw error;

      toast.success('Requisition created successfully');
      navigate('/requisitions');
    } catch (error) {
      console.error('Error creating requisition:', error);
      toast.error('Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/requisitions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Purchase Requisition</h1>
            <p className="text-muted-foreground mt-1">Create a new material procurement request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <Input
                  placeholder="Project ID"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Items</span>
                <Button type="button" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm">Material ID</label>
                    <Input
                      placeholder="Material ID"
                      value={item.material_id}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].material_id = e.target.value;
                        setItems(newItems);
                      }}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-sm">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = parseInt(e.target.value);
                        setItems(newItems);
                      }}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-sm">Unit</label>
                    <Input
                      placeholder="ea"
                      value={item.unit}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].unit = e.target.value;
                        setItems(newItems);
                      }}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-sm">Cost</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.estimated_cost}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].estimated_cost = parseFloat(e.target.value);
                        setItems(newItems);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/requisitions')} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Requisition'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
