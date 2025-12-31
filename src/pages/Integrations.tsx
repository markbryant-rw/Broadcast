import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

const integrations = [
  {
    id: 'agentbuddy',
    name: 'AgentBuddy',
    description: 'Sync your customers and activity data for targeted email campaigns.',
    connected: false,
    logo: '🤖',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email delivery service for sending your campaigns.',
    connected: false,
    logo: '📧',
  },
];

export default function Integrations() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your tools for a seamless email marketing workflow
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      {integration.logo}
                    </div>
                    <div>
                      <CardTitle className="font-display flex items-center gap-2">
                        {integration.name}
                        {integration.connected ? (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {integration.connected ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button className="gradient-primary">
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Need to connect a different service?</p>
              <p className="text-sm text-muted-foreground">
                We're always adding new integrations. Let us know what you need!
              </p>
            </div>
            <Button variant="outline">Request Integration</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}