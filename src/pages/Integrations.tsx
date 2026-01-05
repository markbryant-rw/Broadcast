import { useState } from 'react';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, ExternalLink, CheckCircle2, XCircle, RefreshCw, Loader2, Eye, EyeOff } from 'lucide-react';
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

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const integrations = [
    {
      id: 'agentbuddy',
      name: 'AgentBuddy',
      description: 'Sync your customers and activity data for targeted SMS campaigns.',
      logo: '🤖',
      connected: isConnected,
      connectedAt: connection?.connected_at,
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
      connect.mutate(apiKey, {
        onSuccess: () => setApiKey(''),
      });
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
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your tools for a seamless marketing workflow
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
                          Sync Contacts
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
                ) : integration.id === 'agentbuddy' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${integration.id}`}>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`api-key-${integration.id}`}
                            type={showKey ? 'text' : 'password'}
                            placeholder="Paste your AgentBuddy API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowKey(!showKey)}
                          >
                            {showKey ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <Button
                          className="gradient-primary"
                          onClick={() => handleConnect(integration.id)}
                          disabled={!apiKey.trim() || connect.isPending}
                        >
                          {connect.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                          )}
                          Connect
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generate an API key from{' '}
                        <a
                          href="https://app.agentbuddy.io/settings/integrations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          AgentBuddy Settings
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="gradient-primary"
                    disabled
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Coming Soon
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
    </SettingsLayout>
  );
}
