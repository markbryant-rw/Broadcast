import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailLayout from '@/components/layout/EmailLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, FileEdit, Clock, Send, Loader2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import CampaignsList from '@/components/campaigns/CampaignsList';
import CreateCampaignDialog from '@/components/campaigns/CreateCampaignDialog';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

export default function Campaigns() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { campaigns, isLoading, addCampaign, deleteCampaign } = useCampaigns();
  const { isPlatformAdmin, isLoading: isAdminLoading } = usePlatformAdmin();

  // Redirect non-platform admins to dashboard
  useEffect(() => {
    if (!isAdminLoading && !isPlatformAdmin) {
      navigate('/dashboard');
    }
  }, [isPlatformAdmin, isAdminLoading, navigate]);

  const counts = useMemo(() => ({
    all: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
  }), [campaigns]);

  const tabs = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'draft', label: 'Drafts', count: counts.draft },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'sent', label: 'Sent', count: counts.sent },
  ];

  const handleCreateCampaign = async (data: { name: string; subject?: string; from_name?: string; from_email?: string }) => {
    await addCampaign.mutateAsync({
      name: data.name,
      subject: data.subject || null,
      from_name: data.from_name || null,
      from_email: data.from_email || null,
    });
  };

  const handleDelete = (id: string) => {
    deleteCampaign.mutate(id);
  };

  const filterCampaigns = (status: string) => {
    if (status === 'all') return campaigns;
    return campaigns.filter(c => c.status === status);
  };

  if (isLoading || isAdminLoading) {
    return (
      <EmailLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </EmailLayout>
    );
  }

  // Don't render if not platform admin (will redirect)
  if (!isPlatformAdmin) {
    return null;
  }

  const EmptyState = ({ icon: Icon, title, description }: { icon: typeof Mail; title: string; description: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <EmailLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your email campaigns
            </p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                {tab.label}
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{tab.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {counts.all > 0 ? (
              <CampaignsList campaigns={filterCampaigns('all')} onDelete={handleDelete} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-semibold">No campaigns yet</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    Create your first email campaign to start reaching your audience.
                  </p>
                  <Button className="gradient-primary mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            {counts.draft > 0 ? (
              <CampaignsList campaigns={filterCampaigns('draft')} onDelete={handleDelete} />
            ) : (
              <EmptyState icon={FileEdit} title="No drafts" description="Campaigns you're working on will appear here." />
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {counts.scheduled > 0 ? (
              <CampaignsList campaigns={filterCampaigns('scheduled')} onDelete={handleDelete} />
            ) : (
              <EmptyState icon={Clock} title="No scheduled campaigns" description="Campaigns scheduled for later will appear here." />
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {counts.sent > 0 ? (
              <CampaignsList campaigns={filterCampaigns('sent')} onDelete={handleDelete} />
            ) : (
              <EmptyState icon={Send} title="No sent campaigns" description="Campaigns you've sent will appear here." />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateCampaignDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateCampaign}
      />
    </EmailLayout>
  );
}
