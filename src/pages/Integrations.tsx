import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, ExternalLink, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAgentBuddy } from '@/hooks/useAgentBuddy';
import { format } from 'date-fns';

export default function Integrations() {
  const { 
    isConnected, 
    connection, 
    isLoading, 
    connect, 
    disconnect, 
    sync 
  } = useAgentBuddy();

  const integrations = [
    {
      id: 'agentbuddy',
      name: 'AgentBuddy',
      description: 'Sync your customers and activity data for targeted email campaigns.',
      logo: '🤖',
      connected: isConnected,
      connectedAt: connection?.connected_at,
      scopes: connection?.scopes,
    },
    {
      id: 'resend',
      name: 'Resend',
      description: 'Email delivery service for sending your campaigns.',
      connected: false,
      logo: '📧',
    },
  ];

  const handleConnect = async (id: string) => {
    if (id === 'agentbuddy') {
      connect.mutate();
    }
  };

  const handleDisconnect = async (id: string) => {
    if (id === 'agentbuddy') {
      disconnect.mutate();
    }
  };

  const handleSync = () => {
    sync.mutate();
  };

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
                  <div className="space-y-4">
                    {integration.connectedAt && (
                      <p className="text-sm text-muted-foreground">
                        Connected {format(new Date(integration.connectedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                    {integration.scopes && integration.scopes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {integration.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {integration.id === 'agentbuddy' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSync}
                          disabled={sync.isPending}
                        >
                          {sync.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sync Customers
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDisconnect(integration.id)}
                        disabled={disconnect.isPending}
                      >
                        {disconnect.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="gradient-primary"
                    onClick={() => handleConnect(integration.id)}
                    disabled={connect.isPending || isLoading}
                  >
                    {(connect.isPending || isLoading) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
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
