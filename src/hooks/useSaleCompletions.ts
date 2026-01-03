import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SaleCompletion {
  id: string;
  user_id: string;
  sale_id: string;
  completed_at: string;
}

// Fetch all sale completions for the current user
export function useSaleCompletions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sale-completions', user?.id],
    queryFn: async (): Promise<SaleCompletion[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_sale_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Returns a map of sale_id -> boolean for quick lookups
export function useSaleCompletionMap() {
  const { data: completions = [] } = useSaleCompletions();
  
  const completionMap = new Map<string, boolean>();
  completions.forEach(c => completionMap.set(c.sale_id, true));
  
  return completionMap;
}

// Mark a sale as complete
export function useMarkSaleAsComplete() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_sale_completions')
        .upsert({
          sale_id: saleId,
          user_id: user.id,
        }, {
          onConflict: 'user_id,sale_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-completions'] });
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites-with-counts'] });
      toast({ title: 'Sale marked as complete' });
    },
    onError: () => {
      toast({
        title: 'Error marking sale complete',
        variant: 'destructive',
      });
    },
  });
}

// Undo marking a sale as complete
export function useUndoSaleComplete() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_sale_completions')
        .delete()
        .eq('sale_id', saleId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-completions'] });
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites-with-counts'] });
      toast({ title: 'Sale reopened' });
    },
    onError: () => {
      toast({
        title: 'Error reopening sale',
        variant: 'destructive',
      });
    },
  });
}
