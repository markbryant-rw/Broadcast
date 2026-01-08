import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgentBuddy } from '@/hooks/useAgentBuddy';
import { Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function AgentBuddyCard() {
  const { isConnected, connection, isLoading } = useAgentBuddy();

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
              <CardDescription>Shared database integration</CardDescription>
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
            <span>Checking connection...</span>
          </div>
        ) : isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Using shared AgentBuddy database</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Broadcast is connected to the AgentBuddy ecosystem. Contacts, sales data, and SMS logs are shared across platforms.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            AgentBuddy integration is not configured.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
