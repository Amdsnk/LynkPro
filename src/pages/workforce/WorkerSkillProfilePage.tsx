import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '@/db/supabase';
import { WorkerSkill, ProficiencyLevel } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { SkillBadge } from '@/components/workforce/SkillBadge';
import { format, parseISO } from 'date-fns';

interface SkillFormData {
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  years_experience: number;
  last_used: string;
}

export default function WorkerSkillProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<any>(null);
  const [skills, setSkills] = useState<WorkerSkill[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SkillFormData>({
    defaultValues: {
      skill_name: '',
      proficiency_level: 'beginner',
      years_experience: 0,
      last_used: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    try {
      // Fetch worker profile
      const { data: workerData, error: workerError } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('id', id)
        .maybeSingle();

      if (workerError) throw workerError;
      if (!workerData) {
        toast.error('Worker not found');
        navigate('/workforce/skills');
        return;
      }

      // Fetch worker skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('worker_skills')
        .select('*')
        .eq('user_id', id)
        .order('skill_name');

      if (skillsError) throw skillsError;

      setWorker(workerData);
      setSkills(skillsData || []);
    } catch (error) {
      console.error('Error fetching worker skills:', error);
      toast.error('Failed to load worker profile');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: SkillFormData) {
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

      const { error } = await supabase
        .from('worker_skills')
        .insert([{
          ...data,
          user_id: id,
          firm_id: profile.firm_id,
          certifications: [],
        }]);

      if (error) throw error;

      toast.success('Skill added successfully');
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSkill(skillId: string) {
    if (!skillId || !confirm('Are you sure you want to delete this skill?')) return;

    try {
      const { error } = await supabase
        .from('worker_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast.success('Skill deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  }

  const skillsByProficiency = {
    expert: skills.filter(s => s.proficiency_level === 'expert'),
    advanced: skills.filter(s => s.proficiency_level === 'advanced'),
    intermediate: skills.filter(s => s.proficiency_level === 'intermediate'),
    beginner: skills.filter(s => s.proficiency_level === 'beginner'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading worker profile...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/workforce/skills')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{worker.full_name}</h1>
              <p className="text-muted-foreground mt-1">{worker.role}</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="skill_name"
                    rules={{ required: 'Skill name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Carpentry, Welding" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proficiency_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proficiency Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="years_experience"
                    rules={{
                      required: 'Years of experience is required',
                      min: { value: 0, message: 'Must be 0 or greater' },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_used"
                    rules={{ required: 'Last used date is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Used *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Adding...' : 'Add Skill'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{skills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Expert Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{skillsByProficiency.expert.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Advanced Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{skillsByProficiency.advanced.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {skills.length > 0
                  ? (skills.reduce((sum, s) => sum + s.years_experience, 0) / skills.length).toFixed(1)
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">years</p>
            </CardContent>
          </Card>
        </div>

        {/* Skills by Proficiency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['expert', 'advanced', 'intermediate', 'beginner'] as const).map((level) => (
            <Card key={level}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SkillBadge proficiency={level} />
                  {level.charAt(0).toUpperCase() + level.slice(1)} Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillsByProficiency[level].length === 0 ? (
                  <p className="text-muted-foreground text-sm">No {level} skills yet</p>
                ) : (
                  <div className="space-y-3">
                    {skillsByProficiency[level].map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-start justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{skill.skill_name}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{skill.years_experience} years exp</span>
                            <span>Last used: {skill.last_used ? format(parseISO(skill.last_used), 'MMM yyyy') : 'N/A'}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSkill(skill.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* All Skills List */}
        <Card>
          <CardHeader>
            <CardTitle>All Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No skills recorded yet. Add skills to build this worker's profile.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Skill</th>
                      <th className="text-left py-3 px-4 font-medium">Proficiency</th>
                      <th className="text-right py-3 px-4 font-medium">Experience</th>
                      <th className="text-left py-3 px-4 font-medium">Last Used</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{skill.skill_name}</td>
                        <td className="py-4 px-4">
                          <SkillBadge proficiency={skill.proficiency_level} />
                        </td>
                        <td className="py-4 px-4 text-right">{skill.years_experience} years</td>
                        <td className="py-4 px-4">{skill.last_used ? format(parseISO(skill.last_used), 'MMM d, yyyy') : 'N/A'}</td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSkill(skill.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
