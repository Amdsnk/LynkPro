import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Project, Task } from '@/types/types';

interface TimeTrackerProps {
  projectId?: string;
  taskId?: string;
}

export function TimeTracker({ projectId, taskId }: TimeTrackerProps) {
  const { profile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [selectedTask, setSelectedTask] = useState(taskId || '');
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [profile?.firm_id]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    if (!profile?.firm_id) return;
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('firm_id', profile.firm_id)
      .eq('status', 'active')
      .order('name');
    if (data) setProjects(data as any);
  };

  const fetchTasks = async (projectId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('project_id', projectId)
      .in('status', ['todo', 'in_progress'])
      .order('title');
    if (data) setTasks(data as any);
  };

  const startTimer = () => {
    startTimeRef.current = new Date();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTimer = async () => {
    if (!startTimeRef.current || !profile?.firm_id) return;

    pauseTimer();

    const endTime = new Date();
    const durationMinutes = Math.floor(elapsedSeconds / 60);

    if (durationMinutes === 0) {
      toast.error('Timer must run for at least 1 minute');
      resetTimer();
      return;
    }

    const { error } = await supabase.from('time_entries').insert({
      firm_id: profile.firm_id,
      user_id: profile.id,
      project_id: selectedProject || null,
      task_id: selectedTask || null,
      description: description || null,
      start_time: startTimeRef.current.toISOString(),
      end_time: endTime.toISOString(),
      is_billable: isBillable,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
    });

    if (error) {
      toast.error('Failed to save time entry');
    } else {
      toast.success(`Time entry saved: ${formatTime(elapsedSeconds)}`);
      resetTimer();
    }
  };

  const resetTimer = () => {
    setElapsedSeconds(0);
    setDescription('');
    setSelectedTask('');
    setIsRunning(false);
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-5xl font-mono font-bold text-primary mb-4">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="flex justify-center gap-2">
            {!isRunning && elapsedSeconds === 0 && (
              <Button onClick={startTimer} size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start
              </Button>
            )}
            {isRunning && (
              <Button onClick={pauseTimer} size="lg" variant="outline">
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </Button>
            )}
            {!isRunning && elapsedSeconds > 0 && (
              <>
                <Button onClick={startTimer} size="lg" variant="outline">
                  <Play className="mr-2 h-5 w-5" />
                  Resume
                </Button>
                <Button onClick={stopTimer} size="lg">
                  <Square className="mr-2 h-5 w-5" />
                  Stop & Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Timer Details */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Task (Optional)</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={isBillable} onCheckedChange={setIsBillable} />
              <Label>Billable</Label>
            </div>
            {isBillable && (
              <div className="flex items-center gap-2">
                <Label>Rate:</Label>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">/hr</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
