import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { WorkerSkill, ProficiencyLevel } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { SkillBadge } from '@/components/workforce/SkillBadge';

interface WorkerWithSkills {
  id: string;
  full_name: string;
  role: string;
  skills: Record<string, ProficiencyLevel>;
}

export default function SkillMatrixPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerWithSkills[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch all workers from the firm
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('firm_id', profile.firm_id)
        .order('full_name');

      if (workersError) throw workersError;

      // Fetch all worker skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('worker_skills')
        .select('*')
        .eq('firm_id', profile.firm_id);

      if (skillsError) throw skillsError;

      // Get unique skill names
      const uniqueSkills = Array.from(
        new Set((skillsData || []).map(s => s.skill_name))
      ).sort();

      // Build worker-skill matrix
      const workersWithSkills: WorkerWithSkills[] = (workersData || []).map((worker) => {
        const workerSkills = (skillsData || []).filter(s => s.user_id === worker.id);
        const skillsMap: Record<string, ProficiencyLevel> = {};
        
        workerSkills.forEach((skill) => {
          skillsMap[skill.skill_name] = skill.proficiency_level;
        });

        return {
          id: worker.id,
          full_name: worker.full_name,
          role: worker.role || 'Worker',
          skills: skillsMap,
        };
      });

      setWorkers(workersWithSkills);
      setAllSkills(uniqueSkills);
    } catch (error) {
      console.error('Error fetching skill matrix:', error);
      toast.error('Failed to load skill matrix');
    } finally {
      setLoading(false);
    }
  }

  const filteredWorkers = workers.filter((worker) =>
    worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading skill matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Skill Matrix</h1>
          <p className="text-muted-foreground mt-2">
            View and manage worker skills across your workforce
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skill Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Skills Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No workers found. Add worker skills to populate the matrix.
                </p>
              </div>
            ) : allSkills.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No skills recorded yet. Start adding skills to workers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium sticky left-0 bg-background z-10">
                        Worker
                      </th>
                      <th className="text-left py-3 px-4 font-medium sticky left-0 bg-background z-10">
                        Role
                      </th>
                      {allSkills.map((skill) => (
                        <th
                          key={skill}
                          className="text-center py-3 px-4 font-medium min-w-[120px]"
                        >
                          {skill}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => (
                      <tr
                        key={worker.id}
                        className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/workforce/skills/${worker.id}`)}
                      >
                        <td className="py-4 px-4 font-medium sticky left-0 bg-background">
                          {worker.full_name}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground sticky left-0 bg-background">
                          {worker.role}
                        </td>
                        {allSkills.map((skill) => (
                          <td key={skill} className="py-4 px-4 text-center">
                            {worker.skills[skill] ? (
                              <div className="flex justify-center">
                                <SkillBadge proficiency={worker.skills[skill]} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proficiency Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <SkillBadge proficiency="expert" />
                <span className="text-sm text-muted-foreground">Expert - Highly skilled, can mentor others</span>
              </div>
              <div className="flex items-center gap-2">
                <SkillBadge proficiency="advanced" />
                <span className="text-sm text-muted-foreground">Advanced - Proficient, works independently</span>
              </div>
              <div className="flex items-center gap-2">
                <SkillBadge proficiency="intermediate" />
                <span className="text-sm text-muted-foreground">Intermediate - Competent, occasional guidance needed</span>
              </div>
              <div className="flex items-center gap-2">
                <SkillBadge proficiency="beginner" />
                <span className="text-sm text-muted-foreground">Beginner - Learning, requires supervision</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allSkills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Skills per Worker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {workers.length > 0
                  ? (workers.reduce((sum, w) => sum + Object.keys(w.skills).length, 0) / workers.length).toFixed(1)
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
