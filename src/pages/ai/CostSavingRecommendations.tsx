import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { BudgetPrediction, Project } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { predictBudgetOutcome, formatCurrency } from '@/lib/budgetPrediction';

export default function CostSavingRecommendations() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<BudgetPrediction | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  async function fetchRecommendations() {
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
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const totalSavings = prediction.savings_opportunities.reduce((sum, opp) => sum + opp.potential_savings, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ai/budget-variance/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cost Savings Opportunities</h1>
            <p className="text-muted-foreground mt-1">{prediction.project_name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Total Savings Potential
              </span>
              <span className="text-3xl font-bold text-green-600">{formatCurrency(totalSavings)}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI-Recommended Savings ({prediction.savings_opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prediction.savings_opportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No savings opportunities identified. Project is well-optimized!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {prediction.savings_opportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">{opportunity.category}</Badge>
                          <Badge variant={
                            opportunity.effort_level === 'low' ? 'default' :
                            opportunity.effort_level === 'medium' ? 'secondary' :
                            'destructive'
                          }>
                            {opportunity.effort_level} effort
                          </Badge>
                        </div>
                        <p className="font-medium">{opportunity.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(opportunity.potential_savings)}
                        </p>
                        <p className="text-xs text-muted-foreground">Priority #{opportunity.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Quick Wins (Low Effort)</p>
                <div className="space-y-2">
                  {prediction.savings_opportunities
                    .filter(opp => opp.effort_level === 'low')
                    .map((opp, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">{opp.description}</p>
                          <p className="text-sm font-medium text-green-600">{formatCurrency(opp.potential_savings)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {prediction.savings_opportunities.some(opp => opp.effort_level === 'medium') && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Medium Term (Medium Effort)</p>
                  <div className="space-y-2">
                    {prediction.savings_opportunities
                      .filter(opp => opp.effort_level === 'medium')
                      .map((opp, index) => (
                        <div key={index} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">{opp.description}</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(opp.potential_savings)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/budget-predictions')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
