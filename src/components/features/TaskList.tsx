import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Task, TaskStatus, TaskPriority, Profile } from '@/types/types';

interface TaskListProps {
  projectId: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [projectId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!assigned_to(full_name, email)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchTeamMembers = async () => {
    if (!profile?.firm_id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .in('role', ['admin', 'staff']);

    if (data) setTeamMembers(data);
  };

  const handleCreate = async () => {
    if (!title.trim() || !profile?.firm_id) return;

    const { error } = await supabase.from('tasks').insert({
      firm_id: profile.firm_id,
      project_id: projectId,
      title,
      description: description || null,
      status,
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      created_by: profile.id,
    });

    if (error) {
      toast.error('Failed to create task');
    } else {
      toast.success('Task created');
      setDialogOpen(false);
      resetForm();
      fetchTasks();
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
    } else {
      toast.success('Task updated');
      fetchTasks();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setAssignedTo('');
    setDueDate('');
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v as TaskStatus)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getPriorityColor(task.priority)}>
                    <Flag className="mr-1 h-3 w-3" />
                    {task.priority}
                  </Badge>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {task.assignee && (
                    <Badge variant="outline">
                      <User className="mr-1 h-3 w-3" />
                      {task.assignee.full_name || task.assignee.email}
                    </Badge>
                  )}
                  {task.due_date && (
                    <Badge variant="outline">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
