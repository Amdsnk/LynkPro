import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { BudgetPrediction, Project } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { predictBudgetOutcome, formatCurrency } from '@/lib/budgetPrediction';

export default function CostVarianceForecast() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<BudgetPrediction | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchForecast();
    }
  }, [projectId]);

  async function fetchForecast() {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!projectData) {
        toast.error('Project not found');
        navigate('/ai/budget-predictions');
        return;
      }

      const totalBudget = projectData.budget || 100000;
      const totalSpent = totalBudget * (Math.random() * 0.7 + 0.2);
      const percentComplete = Math.random() * 60 + 20;

      const currentData = {
        totalBudget,
        totalSpent,
        percentComplete,
        categorySpending: {
          Labor: { budgeted: totalBudget * 0.4, spent: totalSpent * 0.4 },
          Materials: { budgeted: totalBudget * 0.35, spent: totalSpent * 0.35 },
          Equipment: { budgeted: totalBudget * 0.15, spent: totalSpent * 0.15 },
          Other: { budgeted: totalBudget * 0.1, spent: totalSpent * 0.1 },
        },
        changeOrders: totalBudget * (Math.random() * 0.05),
        productivityRate: 0.8 + Math.random() * 0.3,
      };

      const pred = predictBudgetOutcome(projectData, currentData);
      setPrediction(pred);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      toast.error('Failed to load forecast');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ai/budget-predictions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cost Variance Forecast</h1>
            <p className="text-muted-foreground mt-1">{prediction.project_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(prediction.current_budget)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Predicted Final Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(prediction.predicted_final_cost)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Predicted Variance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${prediction.predicted_variance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {prediction.predicted_variance > 0 ? '+' : ''}{formatCurrency(prediction.predicted_variance)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {prediction.variance_percentage > 0 ? '+' : ''}{prediction.variance_percentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prediction.cost_breakdown.map((item, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.category}</p>
                    <p className={`font-medium ${item.variance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Budgeted</p>
                      <p className="font-medium">{formatCurrency(item.budgeted)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium">{formatCurrency(item.spent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Predicted</p>
                      <p className="font-medium">{formatCurrency(item.predicted)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/budget-predictions')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(`/ai/cost-savings/${projectId}`)}>
            View Savings Opportunities
          </Button>
        </div>
      </div>
    </div>
  );
}
