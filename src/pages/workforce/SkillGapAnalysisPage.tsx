import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { TaskAssignment, WorkerSkill, ProficiencyLevel } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Download, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import { SkillBadge } from '@/components/workforce/SkillBadge';

interface SkillGap {
  skillName: string;
  requiredCount: number;
  requiredLevel: ProficiencyLevel;
  availableCount: number;
  availableLevel: ProficiencyLevel | null;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
}

export default function SkillGapAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [workerSkills, setWorkerSkills] = useState<WorkerSkill[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && workerSkills.length > 0) {
      analyzeSkillGaps();
    }
  }, [tasks, workerSkills, projectFilter]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.firm_id) return;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('firm_id', profile.firm_id)
        .in('status', ['pending', 'in_progress']);

      if (tasksError) throw tasksError;

      // Fetch worker skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('worker_skills')
        .select('*')
        .eq('firm_id', profile.firm_id);

      if (skillsError) throw skillsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (projectsError) throw projectsError;

      setTasks(tasksData || []);
      setWorkerSkills(skillsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load skill gap analysis');
    } finally {
      setLoading(false);
    }
  }

  function analyzeSkillGaps() {
    const filteredTasks = projectFilter === 'all' 
      ? tasks 
      : tasks.filter(t => t.project_id === projectFilter);

    // Count required skills
    const requiredSkills: Record<string, { count: number; level: ProficiencyLevel }> = {};
    
    filteredTasks.forEach((task) => {
      task.required_skills?.forEach((reqSkill) => {
        if (!requiredSkills[reqSkill.skill_name]) {
          requiredSkills[reqSkill.skill_name] = { count: 0, level: reqSkill.proficiency_level };
        }
        requiredSkills[reqSkill.skill_name].count += 1;
        
        // Use highest proficiency level required
        const proficiencyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        if (proficiencyOrder[reqSkill.proficiency_level] > proficiencyOrder[requiredSkills[reqSkill.skill_name].level]) {
          requiredSkills[reqSkill.skill_name].level = reqSkill.proficiency_level;
        }
      });
    });

    // Count available skills
    const availableSkills: Record<string, { count: number; level: ProficiencyLevel }> = {};
    
    workerSkills.forEach((skill) => {
      if (!availableSkills[skill.skill_name]) {
        availableSkills[skill.skill_name] = { count: 0, level: skill.proficiency_level };
      }
      availableSkills[skill.skill_name].count += 1;
      
      // Use highest proficiency level available
      const proficiencyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      if (proficiencyOrder[skill.proficiency_level] > proficiencyOrder[availableSkills[skill.skill_name].level]) {
        availableSkills[skill.skill_name].level = skill.proficiency_level;
      }
    });

    // Calculate gaps
    const gaps: SkillGap[] = [];
    
    // Skills that are required
    Object.keys(requiredSkills).forEach((skillName) => {
      const required = requiredSkills[skillName];
      const available = availableSkills[skillName] || { count: 0, level: null };
      const gap = required.count - available.count;
      
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
      let recommendedAction = 'Sufficient capacity';
      
      if (gap > 0) {
        if (gap >= 5) {
          priority = 'critical';
          recommendedAction = `Hire ${gap} workers with ${required.level} proficiency`;
        } else if (gap >= 3) {
          priority = 'high';
          recommendedAction = `Train or hire ${gap} workers`;
        } else {
          priority = 'medium';
          recommendedAction = `Consider training ${gap} workers`;
        }
      } else if (gap < -2) {
        priority = 'low';
        recommendedAction = 'Overstaffed - consider reallocation';
      }
      
      gaps.push({
        skillName,
        requiredCount: required.count,
        requiredLevel: required.level,
        availableCount: available.count,
        availableLevel: available.level,
        gap,
        priority,
        recommendedAction,
      });
    });

    // Skills that are available but not required
    Object.keys(availableSkills).forEach((skillName) => {
      if (!requiredSkills[skillName]) {
        const available = availableSkills[skillName];
        gaps.push({
          skillName,
          requiredCount: 0,
          requiredLevel: 'beginner' as ProficiencyLevel,
          availableCount: available.count,
          availableLevel: available.level,
          gap: -available.count,
          priority: 'low',
          recommendedAction: 'Not currently needed',
        });
      }
    });

    // Sort by priority and gap
    gaps.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.gap - a.gap;
    });

    setSkillGaps(gaps);
  }

  function exportReport() {
    const csv = [
      ['Skill Name', 'Required', 'Available', 'Gap', 'Priority', 'Recommended Action'],
      ...skillGaps.map(gap => [
        gap.skillName,
        `${gap.requiredCount} (${gap.requiredLevel})`,
        gap.availableLevel ? `${gap.availableCount} (${gap.availableLevel})` : '0',
        gap.gap.toString(),
        gap.priority,
        gap.recommendedAction,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-gap-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
      critical: { variant: 'destructive', className: '' },
      high: { variant: 'default', className: 'bg-orange-500' },
      medium: { variant: 'default', className: 'bg-yellow-500' },
      low: { variant: 'secondary', className: '' },
    };
    const config = variants[priority] || variants.low;
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  const totalRequired = skillGaps.reduce((sum, gap) => sum + gap.requiredCount, 0);
  const totalAvailable = skillGaps.reduce((sum, gap) => sum + gap.availableCount, 0);
  const criticalGaps = skillGaps.filter(g => g.priority === 'critical').length;
  const understaffed = skillGaps.filter(g => g.gap > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading skill gap analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Skill Gap Analysis</h1>
            <p className="text-muted-foreground mt-2">
              Identify skill gaps and training needs across your workforce
            </p>
          </div>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Skills Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRequired}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {tasks.filter(t => projectFilter === 'all' || t.project_id === projectFilter).length} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Skills Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAvailable}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across workforce
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{criticalGaps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Understaffed Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{understaffed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need more capacity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Project:</label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis Table */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Details</CardTitle>
          </CardHeader>
          <CardContent>
            {skillGaps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No skill gaps identified. All required skills are adequately staffed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Skill Name</th>
                      <th className="text-left py-3 px-4 font-medium">Required</th>
                      <th className="text-left py-3 px-4 font-medium">Available</th>
                      <th className="text-center py-3 px-4 font-medium">Gap</th>
                      <th className="text-left py-3 px-4 font-medium">Priority</th>
                      <th className="text-left py-3 px-4 font-medium">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillGaps.map((gap, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{gap.skillName}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span>{gap.requiredCount}</span>
                            <SkillBadge proficiency={gap.requiredLevel} />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span>{gap.availableCount}</span>
                            {gap.availableLevel && <SkillBadge proficiency={gap.availableLevel} />}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {gap.gap > 0 ? (
                              <>
                                <TrendingDown className="h-4 w-4 text-destructive" />
                                <span className="font-semibold text-destructive">-{gap.gap}</span>
                              </>
                            ) : gap.gap < 0 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">+{Math.abs(gap.gap)}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getPriorityBadge(gap.priority)}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {gap.recommendedAction}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
