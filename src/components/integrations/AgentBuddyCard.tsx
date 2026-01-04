import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAgentBuddy } from '@/hooks/useAgentBuddy';
import { Users, RefreshCw, Link2, Unlink, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export function AgentBuddyCard() {
  const { isConnected, connection, isLoading, connect, disconnect, sync } = useAgentBuddy();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleConnect = () => {
    connect.mutate(apiKey, {
      onSuccess: () => setApiKey(''),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AgentBuddy</CardTitle>
              <CardDescription>Sync contacts and log SMS activity</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking connection...</span>
          </div>
        ) : isConnected ? (
          <>
            {connection?.connected_at && (
              <p className="text-sm text-muted-foreground">
                Connected on {format(new Date(connection.connected_at), 'PPp')}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                {sync.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Contacts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
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
                  onClick={handleConnect}
                  disabled={!apiKey.trim() || connect.isPending}
                >
                  {connect.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
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
        )}
      </CardContent>
    </Card>
  );
}
