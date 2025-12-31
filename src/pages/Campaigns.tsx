import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, FileEdit, Clock, Send, Pause } from 'lucide-react';

const tabs = [
  { value: 'all', label: 'All', count: 0 },
  { value: 'draft', label: 'Drafts', count: 0 },
  { value: 'scheduled', label: 'Scheduled', count: 0 },
  { value: 'sent', label: 'Sent', count: 0 },
];

export default function Campaigns() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your email campaigns
            </p>
          </div>
          <Button className="gradient-primary">
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold">No campaigns yet</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  Create your first email campaign to start reaching your audience.
                </p>
                <Button className="gradient-primary mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileEdit className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold">No drafts</h3>
                <p className="text-muted-foreground mt-1">
                  Campaigns you're working on will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold">No scheduled campaigns</h3>
                <p className="text-muted-foreground mt-1">
                  Campaigns scheduled for later will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold">No sent campaigns</h3>
                <p className="text-muted-foreground mt-1">
                  Campaigns you've sent will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}