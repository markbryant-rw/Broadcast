import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ConnectionStatus {
  connected: boolean;
  connection?: {
    connected_at: string;
  };
}

export function useAgentBuddy() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['agentbuddy-status'],
    queryFn: async (): Promise<ConnectionStatus> => {
      const { data, error } = await supabase
        .from('agentbuddy_connections')
        .select('connected_at')
        .eq('user_id', session!.user.id)
        .maybeSingle();

      if (error) throw error;

      return {
        connected: !!data,
        connection: data ? { connected_at: data.connected_at } : undefined,
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 30000,
  });

  const connect = useMutation({
    mutationFn: async (apiKey: string) => {
      if (!apiKey.trim()) {
        throw new Error('API key is required');
      }

      // Validate the API key by making a test call to AgentBuddy
      const response = await fetch(
        `https://bessucubulzbrrujkcxg.supabase.co/functions/v1/agentbuddy-validate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ api_key: apiKey }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate API key');
      }

      return response.json();
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
      const { error } = await supabase
        .from('agentbuddy_connections')
        .delete()
        .eq('user_id', session!.user.id);

      if (error) throw error;
      return { success: true };
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync customers');
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
