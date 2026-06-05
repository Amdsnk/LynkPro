import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulation, SimulationVariable } from '@/contexts/SimulationContext';
import { Play, Pause, RotateCcw, Save, TrendingUp, TrendingDown, DollarSign, Calendar, Users, GitCompare, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { toast } from 'sonner';

interface SimulationPanelProps {
  entityType: 'project' | 'budget' | 'timeline';
  entityId: string;
  baselineData: Record<string, any>;
  onSimulationChange?: (predictions: Record<string, any>) => void;
}

interface ScenarioComparison {
  metric: string;
  baseline: number | string;
  simulated: number | string;
  change: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export function SimulationPanel({
  entityType,
  entityId,
  baselineData,
  onSimulationChange,
}: SimulationPanelProps) {
  const { simulationState, startSimulation, endSimulation, updateVariable, saveScenario, resetToBaseline } = useSimulation();
  const [scenarioName, setScenarioName] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleStart = () => {
    startSimulation(baselineData);
    toast.success('Simulation mode activated');
  };

  const handleEnd = () => {
    endSimulation();
    toast.info('Simulation mode ended');
  };

  const handleApply = () => {
    if (predictions) {
      onSimulationChange?.(predictions);
      toast.success('Simulation changes applied');
    }
  };

  const handleReset = () => {
    resetToBaseline();
    toast.info('Reset to baseline values');
  };

  const handleSave = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName, `Simulation for ${entityType} ${entityId}`);
      setScenarioName('');
      toast.success(`Scenario "${scenarioName}" saved`);
    }
  };

  // Calculate predictions based on current variables
  const calculatePredictions = () => {
    if (!simulationState.currentScenario) return null;

    const variables = simulationState.currentScenario.variables;
    const budget = variables.find((v) => v.id === 'budget')?.simulatedValue as number || baselineData.budget || 100000;
    const teamSize = variables.find((v) => v.id === 'teamSize')?.simulatedValue as number || baselineData.teamSize || 5;
    const duration = variables.find((v) => v.id === 'duration')?.simulatedValue as number || baselineData.duration || 30;

    // Advanced prediction logic
    const costPerPerson = budget / teamSize;
    const dailyCost = budget / duration;
    const completionProbability = Math.min(95, 50 + (budget / 1000) + (teamSize * 5));
    const riskScore = Math.max(5, 100 - completionProbability);
    
    // Calculate budget efficiency
    const budgetEfficiency = (teamSize * duration) / (budget / 1000);
    const timelineRisk = duration < 30 ? 'high' : duration < 60 ? 'medium' : 'low';
    const resourceUtilization = Math.min(100, (teamSize / 10) * 100);

    return {
      totalCost: budget,
      costPerPerson,
      dailyCost,
      completionProbability,
      riskScore,
      budgetEfficiency,
      timelineRisk,
      resourceUtilization,
      estimatedEndDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString(),
      projectedRevenue: budget * 1.3, // 30% margin
      roi: ((budget * 1.3 - budget) / budget * 100).toFixed(1),
    };
  };

  const predictions = calculatePredictions();

  // Generate comparison data
  const generateComparison = (): ScenarioComparison[] => {
    if (!predictions) return [];

    return [
      {
        metric: 'Total Cost',
        baseline: `$${(baselineData.budget || 100000).toLocaleString()}`,
        simulated: `$${predictions.totalCost.toLocaleString()}`,
        change: ((predictions.totalCost - (baselineData.budget || 100000)) / (baselineData.budget || 100000)) * 100,
        impact: predictions.totalCost > (baselineData.budget || 100000) ? 'negative' : predictions.totalCost < (baselineData.budget || 100000) ? 'positive' : 'neutral',
      },
      {
        metric: 'Team Size',
        baseline: `${baselineData.teamSize || 5} people`,
        simulated: `${simulationState.currentScenario?.variables.find(v => v.id === 'teamSize')?.simulatedValue || 5} people`,
        change: ((Number(simulationState.currentScenario?.variables.find(v => v.id === 'teamSize')?.simulatedValue || 5) - (baselineData.teamSize || 5)) / (baselineData.teamSize || 5)) * 100,
        impact: 'neutral',
      },
      {
        metric: 'Duration',
        baseline: `${baselineData.duration || 30} days`,
        simulated: `${simulationState.currentScenario?.variables.find(v => v.id === 'duration')?.simulatedValue || 30} days`,
        change: ((Number(simulationState.currentScenario?.variables.find(v => v.id === 'duration')?.simulatedValue || 30) - (baselineData.duration || 30)) / (baselineData.duration || 30)) * 100,
        impact: Number(simulationState.currentScenario?.variables.find(v => v.id === 'duration')?.simulatedValue || 30) > (baselineData.duration || 30) ? 'negative' : 'positive',
      },
      {
        metric: 'Risk Score',
        baseline: '45%',
        simulated: `${predictions.riskScore.toFixed(0)}%`,
        change: predictions.riskScore - 45,
        impact: predictions.riskScore > 45 ? 'negative' : 'positive',
      },
      {
        metric: 'Completion Probability',
        baseline: '55%',
        simulated: `${predictions.completionProbability.toFixed(0)}%`,
        change: predictions.completionProbability - 55,
        impact: predictions.completionProbability > 55 ? 'positive' : 'negative',
      },
      {
        metric: 'ROI',
        baseline: '30%',
        simulated: `${predictions.roi}%`,
        change: Number(predictions.roi) - 30,
        impact: Number(predictions.roi) > 30 ? 'positive' : 'negative',
      },
    ];
  };

  const comparisonData = generateComparison();

  if (!simulationState.isActive) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-ai-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Play className="h-4 w-4 text-primary" />
            </div>
            Simulation Mode
            <Badge variant="outline" className="ml-auto">Ready to Start</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Test different scenarios and see predicted outcomes in real-time
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4 py-8">
            <p className="text-sm text-muted-foreground">
              Test different scenarios and see predicted outcomes
            </p>
            <Button onClick={handleStart} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Simulation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-ai-primary/5 to-insight/5 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-ai-primary flex items-center justify-center animate-pulse">
              <Play className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Simulation Active
                <Badge variant="default" className="animate-pulse">LIVE</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust variables to see real-time predictions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={resetToBaseline}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" variant="outline" onClick={handleEnd}>
              <Pause className="h-4 w-4 mr-1" />
              End
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="variables">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="predictions">
              Predictions
              <Badge variant="secondary" className="ml-2 text-xs">AI</Badge>
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <GitCompare className="h-3 w-3 mr-1" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-6 mt-4">
            {/* Budget Slider */}
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-semibold">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Budget
                </Label>
                <span className="text-lg font-bold text-primary">
                  ${(simulationState.currentScenario?.variables.find((v) => v.id === 'budget')?.simulatedValue as number || baselineData.budget || 100000).toLocaleString()}
                </span>
              </div>
              <Slider
                value={[simulationState.currentScenario?.variables.find((v) => v.id === 'budget')?.simulatedValue as number || baselineData.budget || 100000]}
                onValueChange={(value) => updateVariable('budget', value[0])}
                min={50000}
                max={500000}
                step={10000}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$50K</span>
                <span>$500K</span>
              </div>
            </div>

            {/* Team Size Slider */}
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Team Size
                </Label>
                <span className="text-lg font-bold text-primary">
                  {simulationState.currentScenario?.variables.find((v) => v.id === 'teamSize')?.simulatedValue as number || baselineData.teamSize || 5} people
                </span>
              </div>
              <Slider
                value={[simulationState.currentScenario?.variables.find((v) => v.id === 'teamSize')?.simulatedValue as number || baselineData.teamSize || 5]}
                onValueChange={(value) => updateVariable('teamSize', value[0])}
                min={1}
                max={20}
                step={1}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 person</span>
                <span>20 people</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-background/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  Duration
                </Label>
                <span className="text-lg font-bold text-primary">
                  {simulationState.currentScenario?.variables.find((v) => v.id === 'duration')?.simulatedValue as number || baselineData.duration || 30} days
                </span>
              </div>
              <Slider
                value={[simulationState.currentScenario?.variables.find((v) => v.id === 'duration')?.simulatedValue as number || baselineData.duration || 30]}
                onValueChange={(value) => updateVariable('duration', value[0])}
                min={7}
                max={180}
                step={7}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>7 days</span>
                <span>180 days</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4 mt-4">
            {predictions && (
              <>
                {/* Completion Probability */}
                <div className="p-4 rounded-lg border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Completion Probability
                    </span>
                    <Badge variant={predictions.completionProbability >= 70 ? 'default' : 'destructive'} className="text-base px-3 py-1">
                      {predictions.completionProbability.toFixed(0)}%
                    </Badge>
                  </div>
                  <ConfidenceIndicator confidence={predictions.completionProbability} showLabel={false} />
                </div>

                {/* Risk Score */}
                <div className="p-4 rounded-lg border-2 border-critical/30 bg-gradient-to-r from-critical/10 to-critical/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-critical" />
                      Risk Score
                    </span>
                    <Badge variant={predictions.riskScore <= 30 ? 'default' : 'destructive'} className="text-base px-3 py-1">
                      {predictions.riskScore.toFixed(0)}%
                    </Badge>
                  </div>
                  <ConfidenceIndicator confidence={100 - predictions.riskScore} showLabel={false} />
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Cost per Person</p>
                    <p className="text-lg font-semibold">${predictions.costPerPerson.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-xs text-muted-foreground mb-1">Daily Cost</p>
                    <p className="text-lg font-semibold">${predictions.dailyCost.toLocaleString()}</p>
                  </div>
                </div>

                {/* Estimated End Date */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Completion</p>
                  <p className="text-base font-semibold">{predictions.estimatedEndDate}</p>
                </div>

                {/* Impact Summary */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-2">Impact Summary</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      {predictions.completionProbability >= 70 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      {predictions.completionProbability >= 70
                        ? 'High probability of on-time completion'
                        : 'Risk of delays - consider adjustments'}
                    </p>
                    <p className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      Projected ROI: {predictions.roi}%
                    </p>
                    <p className="flex items-center gap-2">
                      {predictions.timelineRisk === 'low' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-warning" />
                      )}
                      Timeline Risk: {predictions.timelineRisk}
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-ai-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <GitCompare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Baseline vs Simulated</h3>
              </div>
              
              <div className="space-y-3">
                {comparisonData.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.metric}</span>
                      <Badge 
                        variant={item.impact === 'positive' ? 'default' : item.impact === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Baseline</p>
                        <p className="font-semibold">{item.baseline}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Simulated</p>
                        <p className="font-semibold">{item.simulated}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Impact */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium mb-2">Overall Impact</p>
                <div className="flex items-center gap-2 text-sm">
                  {comparisonData.filter(d => d.impact === 'positive').length > comparisonData.filter(d => d.impact === 'negative').length ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Positive scenario - improvements detected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-warning font-medium">Mixed results - review carefully</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={handleApply} className="flex-1" size="lg">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Save Scenario */}
        <div className="pt-4 border-t border-border space-y-2">
          <Label htmlFor="scenario-name">Save this scenario</Label>
          <div className="flex gap-2">
            <Input
              id="scenario-name"
              placeholder="Scenario name..."
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
            <Button onClick={handleSave} disabled={!scenarioName.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
