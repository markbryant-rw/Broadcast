import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ActionType = 'contacted' | 'ignored';

interface RecordActionParams {
  saleId: string;
  contactId: string;
  action: ActionType;
}

export function useRecordContactAction() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ saleId, contactId, action }: RecordActionParams) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('sale_contact_actions')
        .insert({
          sale_id: saleId,
          contact_id: contactId,
          user_id: user.id,
          action,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate the opportunities query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['opportunities-for-sale'] });
      queryClient.invalidateQueries({ queryKey: ['sale-progress'] });
      
      const message = variables.action === 'contacted' 
        ? 'Marked as contacted' 
        : 'Marked as ignored';
      toast({ title: message });
    },
    onError: () => {
      toast({
        title: 'Error recording action',
        variant: 'destructive',
      });
    },
  });
}
