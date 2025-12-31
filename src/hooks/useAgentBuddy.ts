import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ConnectionStatus {
  connected: boolean;
  connection?: {
    connected_at: string;
    scopes: string[];
    token_expires_at: string;
  };
}

export function useAgentBuddy() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['agentbuddy-status'],
    queryFn: async (): Promise<ConnectionStatus> => {
      const { data, error } = await supabase.functions.invoke('agentbuddy-oauth', {
        body: {},
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      // Parse the URL to add action parameter
      const response = await fetch(
        `https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-oauth?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      return response.json();
    },
    enabled: !!session?.access_token,
    staleTime: 30000,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-oauth?action=authorize`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const { auth_url } = await response.json();
      
      // Open OAuth popup
      const popup = window.open(auth_url, 'agentbuddy-oauth', 'width=600,height=700');
      
      // Listen for success message
      return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'agentbuddy-oauth-success') {
            window.removeEventListener('message', handleMessage);
            resolve(true);
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('OAuth timeout'));
        }, 300000);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentbuddy-status'] });
      toast.success('AgentBuddy connected successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect AgentBuddy');
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-oauth?action=disconnect`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentbuddy-status'] });
      toast.success('AgentBuddy disconnected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect');
    },
  });

  const sync = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync customers');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Synced ${data.synced} customers from AgentBuddy`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync customers');
    },
  });

  return {
    isConnected: statusQuery.data?.connected ?? false,
    connection: statusQuery.data?.connection,
    isLoading: statusQuery.isLoading,
    connect,
    disconnect,
    sync,
  };
}
