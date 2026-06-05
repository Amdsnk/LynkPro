import { useEffect, useState } from 'react';
import MultiSelect from '@/components/ui/multi-select';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectMultiSelectProps {
  selectedProjects: string[];
  onProjectsChange: (projects: string[]) => void;
  className?: string;
}

interface Project {
  id: string;
  name: string;
}

export default function ProjectMultiSelect({
  selectedProjects,
  onProjectsChange,
  className = '',
}: ProjectMultiSelectProps) {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [profile]);

  const fetchProjects = async () => {
    if (!profile?.firm_id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('firm_id', profile.firm_id)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = projects.map(project => ({
    label: project.name,
    value: project.id,
  }));

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-1.5 block">Projects</label>
      <MultiSelect
        options={options}
        value={selectedProjects}
        onChange={onProjectsChange}
        disabled={loading}
      />
    </div>
  );
}
