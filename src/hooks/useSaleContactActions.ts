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

interface MarkSaleCompleteParams {
  saleId: string;
  suburb: string;
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
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites-with-counts'] });
      
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

export function useMarkSaleComplete() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ saleId, suburb }: MarkSaleCompleteParams) => {
      if (!user) throw new Error('Not authenticated');

      // Step 1: Mark the sale itself as complete in user_sale_completions
      const { error: completionError } = await supabase
        .from('user_sale_completions')
        .upsert({
          sale_id: saleId,
          user_id: user.id,
        }, {
          onConflict: 'user_id,sale_id'
        });

      if (completionError) throw completionError;

      // Step 2: Also mark any existing contacts as ignored (existing behavior)
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .ilike('address_suburb', suburb);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) return;

      // Get existing actions for this sale
      const { data: existingActions, error: actionsError } = await supabase
        .from('sale_contact_actions')
        .select('contact_id')
        .eq('sale_id', saleId)
        .eq('user_id', user.id);

      if (actionsError) throw actionsError;

      const actionedContactIds = new Set(existingActions?.map(a => a.contact_id) || []);
      
      // Filter to only contacts not yet actioned
      const contactsToIgnore = contacts.filter(c => !actionedContactIds.has(c.id));

      if (contactsToIgnore.length === 0) return;

      // Bulk insert ignored actions
      const { error: insertError } = await supabase
        .from('sale_contact_actions')
        .insert(
          contactsToIgnore.map(contact => ({
            sale_id: saleId,
            contact_id: contact.id,
            user_id: user.id,
            action: 'ignored',
          }))
        );

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities-for-sale'] });
      queryClient.invalidateQueries({ queryKey: ['sale-progress'] });
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sale-completions'] });
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
