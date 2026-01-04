import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type ConnectionStatus = 'exchanging' | 'success' | 'error';

export default function ConnectAgentBuddy() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConnectionStatus>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');
  const callbackUrl = searchParams.get('callback');

  useEffect(() => {
    if (!token || !callbackUrl) {
      setStatus('error');
      setErrorMessage('Missing token or callback URL');
      return;
    }

    const exchangeToken = async () => {
      try {
        // Call AgentBuddy's token exchange endpoint
        const response = await fetch(
          'https://mxsefnpxrnamupatgrlb.supabase.co/functions/v1/broadcast-token-exchange',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Token exchange failed');
        }

        // Store the API key (this will be handled by a Broadcast edge function)
        const storeResponse = await fetch(
          'https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-store-connection',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: data.api_key,
              team_id: data.team_id,
              scopes: data.scopes,
            }),
          }
        );

        if (!storeResponse.ok) {
          const storeError = await storeResponse.json();
          throw new Error(storeError.error || 'Failed to store connection');
        }

        setStatus('success');

        // Redirect back to AgentBuddy after a brief delay
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
      }
    };

    exchangeToken();
  }, [token, callbackUrl]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'exchanging' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Connecting to AgentBuddy...</h2>
              <p className="text-muted-foreground">Please wait while we establish the connection.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">Connected!</h2>
              <p className="text-muted-foreground">Redirecting you back to AgentBuddy...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Connection Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              {callbackUrl && (
                <a
                  href={callbackUrl}
                  className="text-primary hover:underline inline-block mt-4"
                >
                  Return to AgentBuddy
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
