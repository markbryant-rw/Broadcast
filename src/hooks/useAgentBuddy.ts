import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * AgentBuddy integration hook
 *
 * Note: Broadcast now uses AgentBuddy's shared database directly.
 * Connection management and syncing are no longer needed.
 * This hook is retained for backward compatibility but returns stub data.
 */

interface ConnectionStatus {
  connected: boolean;
  connection?: {
    connected_at: string;
  };
}

export function useAgentBuddy() {
  const { session } = useAuth();

  // Stub query - always returns connected since we're using the shared database
  const statusQuery = useQuery({
    queryKey: ['agentbuddy-status'],
    queryFn: async (): Promise<ConnectionStatus> => {
      // Since we're using AgentBuddy's database directly, we're always "connected"
      return {
        connected: true,
        connection: {
          connected_at: new Date().toISOString(),
        },
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 30000,
  });

  return {
    isConnected: true, // Always connected since we use shared database
    connection: statusQuery.data?.connection,
    isLoading: statusQuery.isLoading,
    // Removed: connect, disconnect, sync mutations (no longer needed)
  };
}
