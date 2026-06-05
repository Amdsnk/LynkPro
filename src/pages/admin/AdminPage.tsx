import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserManagement } from '@/components/admin/UserManagement';
import { FirmSettings } from '@/components/admin/FirmSettings';
import { ProposalTemplates } from '@/components/admin/ProposalTemplates';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { ActivityDashboard } from '@/components/admin/ActivityDashboard';
import { Mail } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="section-spacing">
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-title">Admin Panel</h1>
        <Link to="/admin/invitations">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Manage Invitations
          </Button>
        </Link>
      </div>
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="firm">Firm</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <ActivityDashboard />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="firm">
          <FirmSettings />
        </TabsContent>
        
        <TabsContent value="templates">
          <ProposalTemplates />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
