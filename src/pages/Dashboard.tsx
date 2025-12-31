import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, MousePointer, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';

const stats = [
  {
    name: 'Total Contacts',
    value: '0',
    change: '+0%',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    name: 'Campaigns Sent',
    value: '0',
    change: '+0%',
    icon: Mail,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    name: 'Open Rate',
    value: '0%',
    change: '+0%',
    icon: MousePointer,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    name: 'Click Rate',
    value: '0%',
    change: '+0%',
    icon: TrendingUp,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your email marketing.
            </p>
          </div>
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {stat.change}
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Recent Campaigns</CardTitle>
              <CardDescription>Your latest email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No campaigns yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Create your first campaign to get started
                </p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Contact Growth</CardTitle>
              <CardDescription>Your contact list over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No contacts yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Import contacts or connect AgentBuddy
                </p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}