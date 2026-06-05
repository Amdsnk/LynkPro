import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  FileText,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface ContextData {
  type: 'project' | 'invoice' | 'client' | 'task' | 'dashboard' | 'unknown';
  id?: string;
  title: string;
  insights: Array<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    confidence?: number;
  }>;
  predictions: Array<{
    type: string;
    message: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  suggestedActions: Array<{
    label: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export function ContextAwarePanel() {
  const location = useLocation();
  const [context, setContext] = useState<ContextData | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Detect context based on current route and page content
  useEffect(() => {
    const detectContext = (): ContextData => {
      const path = location.pathname;

      // Project context
      if (path.includes('/projects/') && path.split('/').length > 2) {
        return {
          type: 'project',
          id: path.split('/')[2],
          title: 'Project Context',
          insights: [
            {
              icon: <Target className="h-4 w-4" />,
              label: 'Completion',
              value: '67%',
              trend: 'up',
              confidence: 85
            },
            {
              icon: <DollarSign className="h-4 w-4" />,
              label: 'Budget Used',
              value: '$45K / $75K',
              trend: 'neutral',
              confidence: 100
            },
            {
              icon: <Clock className="h-4 w-4" />,
              label: 'Days Remaining',
              value: '12 days',
              trend: 'down',
              confidence: 90
            },
            {
              icon: <Users className="h-4 w-4" />,
              label: 'Team Members',
              value: '5 active',
              confidence: 100
            }
          ],
          predictions: [
            {
              type: 'timeline',
              message: 'Likely to complete on time',
              confidence: 78,
              impact: 'low'
            },
            {
              type: 'budget',
              message: 'May exceed budget by 8%',
              confidence: 65,
              impact: 'medium'
            }
          ],
          suggestedActions: [
            {
              label: 'Review milestone progress',
              description: 'Check if all milestones are on track',
              priority: 'high'
            },
            {
              label: 'Optimize resource allocation',
              description: 'Reduce budget overrun risk',
              priority: 'medium'
            }
          ]
        };
      }

      // Invoice context
      if (path.includes('/invoices/') && path.split('/').length > 2) {
        return {
          type: 'invoice',
          id: path.split('/')[2],
          title: 'Invoice Context',
          insights: [
            {
              icon: <DollarSign className="h-4 w-4" />,
              label: 'Amount',
              value: '$12,500',
              confidence: 100
            },
            {
              icon: <Clock className="h-4 w-4" />,
              label: 'Due Date',
              value: '5 days',
              trend: 'down',
              confidence: 100
            },
            {
              icon: <Activity className="h-4 w-4" />,
              label: 'Payment Status',
              value: 'Pending',
              confidence: 100
            }
          ],
          predictions: [
            {
              type: 'payment',
              message: 'High probability of on-time payment',
              confidence: 82,
              impact: 'low'
            }
          ],
          suggestedActions: [
            {
              label: 'Send payment reminder',
              description: 'Automated reminder 3 days before due date',
              priority: 'medium'
            }
          ]
        };
      }

      // Client context
      if (path.includes('/clients/') && path.split('/').length > 2) {
        return {
          type: 'client',
          id: path.split('/')[2],
          title: 'Client Context',
          insights: [
            {
              icon: <DollarSign className="h-4 w-4" />,
              label: 'Total Revenue',
              value: '$125K',
              trend: 'up',
              confidence: 100
            },
            {
              icon: <FileText className="h-4 w-4" />,
              label: 'Active Projects',
              value: '3 projects',
              confidence: 100
            },
            {
              icon: <TrendingUp className="h-4 w-4" />,
              label: 'Satisfaction',
              value: '4.8/5.0',
              trend: 'up',
              confidence: 85
            }
          ],
          predictions: [
            {
              type: 'retention',
              message: 'High retention probability',
              confidence: 88,
              impact: 'low'
            },
            {
              type: 'upsell',
              message: 'Good opportunity for upsell',
              confidence: 72,
              impact: 'medium'
            }
          ],
          suggestedActions: [
            {
              label: 'Schedule quarterly review',
              description: 'Discuss ongoing projects and future opportunities',
              priority: 'high'
            },
            {
              label: 'Propose additional services',
              description: 'Based on current project success',
              priority: 'medium'
            }
          ]
        };
      }

      // Dashboard context
      if (path === '/' || path === '/dashboard' || path === '/command-center') {
        return {
          type: 'dashboard',
          title: 'Dashboard Overview',
          insights: [
            {
              icon: <Activity className="h-4 w-4" />,
              label: 'Active Projects',
              value: '12 projects',
              trend: 'up',
              confidence: 100
            },
            {
              icon: <AlertTriangle className="h-4 w-4" />,
              label: 'At Risk',
              value: '3 items',
              trend: 'down',
              confidence: 85
            },
            {
              icon: <DollarSign className="h-4 w-4" />,
              label: 'Revenue (MTD)',
              value: '$245K',
              trend: 'up',
              confidence: 95
            },
            {
              icon: <TrendingUp className="h-4 w-4" />,
              label: 'Growth',
              value: '+18%',
              trend: 'up',
              confidence: 80
            }
          ],
          predictions: [
            {
              type: 'revenue',
              message: 'On track to exceed monthly target',
              confidence: 85,
              impact: 'low'
            },
            {
              type: 'risk',
              message: '2 projects need immediate attention',
              confidence: 92,
              impact: 'high'
            }
          ],
          suggestedActions: [
            {
              label: 'Review at-risk projects',
              description: 'Address issues before they escalate',
              priority: 'high'
            },
            {
              label: 'Optimize team allocation',
              description: 'Balance workload across projects',
              priority: 'medium'
            }
          ]
        };
      }

      // Default/Unknown context
      return {
        type: 'unknown',
        title: 'AI Assistant',
        insights: [
          {
            icon: <Sparkles className="h-4 w-4" />,
            label: 'Status',
            value: 'Ready to help',
            confidence: 100
          }
        ],
        predictions: [],
        suggestedActions: [
          {
            label: 'Navigate to a project or invoice',
            description: 'Get contextual insights and predictions',
            priority: 'low'
          }
        ]
      };
    };

    const newContext = detectContext();
    setContext(newContext);
  }, [location]);

  if (!context || !isVisible) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-ai-primary/5 to-background shadow-lg sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-ai-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {context.title}
            <Badge variant="outline" className="ml-auto text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Context-aware insights and predictions
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Insights */}
        {context.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Key Insights
            </h4>
            <div className="space-y-2">
              {context.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{insight.icon}</div>
                    <span className="text-xs text-muted-foreground">{insight.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{insight.value}</span>
                    {insight.trend && (
                      <TrendingUp 
                        className={cn(
                          "h-3 w-3",
                          insight.trend === 'up' && "text-green-600",
                          insight.trend === 'down' && "text-red-600 rotate-180",
                          insight.trend === 'neutral' && "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictions */}
        {context.predictions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                AI Predictions
              </h4>
              <div className="space-y-2">
                {context.predictions.map((prediction, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border-2",
                      prediction.impact === 'critical' && "border-critical/30 bg-critical/5",
                      prediction.impact === 'high' && "border-warning/30 bg-warning/5",
                      prediction.impact === 'medium' && "border-insight/30 bg-insight/5",
                      prediction.impact === 'low' && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium">{prediction.message}</p>
                      <Badge 
                        variant={
                          prediction.impact === 'critical' ? 'destructive' :
                          prediction.impact === 'high' ? 'destructive' :
                          prediction.impact === 'medium' ? 'secondary' :
                          'default'
                        }
                        className="text-[10px]"
                      >
                        {prediction.type}
                      </Badge>
                    </div>
                    <ConfidenceIndicator 
                      confidence={prediction.confidence}
                      size="sm"
                      showLabel
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Suggested Actions */}
        {context.suggestedActions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Suggested Actions
              </h4>
              <div className="space-y-2">
                {context.suggestedActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Placeholder action handler
                      console.log('Action clicked:', action.label);
                    }}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2 px-3",
                      action.priority === 'high' && "border-primary/50 hover:border-primary",
                      action.priority === 'medium' && "border-border",
                      action.priority === 'low' && "border-border opacity-70"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{action.label}</span>
                        {action.priority === 'high' && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            High
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
