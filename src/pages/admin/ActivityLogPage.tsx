import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { ActivityLog } from '@/components/shared/ActivityLog';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';

export default function ActivityLogPage() {
  const { profile } = useAuth();

  if (!profile?.firm_id) {
    return null;
  }

  return (
    <div className="section-spacing">
      <PageHeader
        title="Activity Log"
        description="Complete audit trail of all actions in your firm"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Activity Log' },
        ]}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ActivityLog firmId={profile.firm_id} limit={100} showTitle={false} />
        </TabsContent>

        <TabsContent value="projects">
          <ActivityLog firmId={profile.firm_id} entityType="project" limit={100} showTitle={false} />
        </TabsContent>

        <TabsContent value="clients">
          <ActivityLog firmId={profile.firm_id} entityType="client" limit={100} showTitle={false} />
        </TabsContent>

        <TabsContent value="invoices">
          <ActivityLog firmId={profile.firm_id} entityType="invoice" limit={100} showTitle={false} />
        </TabsContent>

        <TabsContent value="proposals">
          <ActivityLog firmId={profile.firm_id} entityType="proposal" limit={100} showTitle={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
