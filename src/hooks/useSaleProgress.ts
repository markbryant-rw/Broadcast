import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SaleProgress {
  saleId: string;
  totalOpportunities: number;
  contactedCount: number;
  ignoredCount: number;
  remainingCount: number;
  smsCount: number;
  isComplete: boolean;
  progressPercent: number;
}

export function useSaleProgressMap(saleIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sale-progress', saleIds.join(','), user?.id],
    queryFn: async () => {
      if (!saleIds.length) return {};

      // Get actions for all sales
      const { data: actions, error: actionsError } = await supabase
        .from('sale_contact_actions')
        .select('sale_id, action')
        .in('sale_id', saleIds);

      if (actionsError) throw actionsError;

      // Get SMS counts per sale
      const { data: smsLogs, error: smsError } = await supabase
        .from(TABLES.BROADCAST_SMS_LOGS)
        .select('related_sale_id')
        .in('related_sale_id', saleIds);

      if (smsError) throw smsError;

      // Build progress map
      const progressMap: Record<string, { contacted: number; ignored: number; smsCount: number }> = {};
      
      saleIds.forEach(id => {
        progressMap[id] = { contacted: 0, ignored: 0, smsCount: 0 };
      });

      actions?.forEach(a => {
        if (a.sale_id && progressMap[a.sale_id]) {
          if (a.action === 'contacted') {
            progressMap[a.sale_id].contacted++;
          } else if (a.action === 'ignored') {
            progressMap[a.sale_id].ignored++;
          }
        }
      });

      smsLogs?.forEach(s => {
        if (s.related_sale_id && progressMap[s.related_sale_id]) {
          progressMap[s.related_sale_id].smsCount++;
        }
      });

      return progressMap;
    },
    enabled: !!user && saleIds.length > 0,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useSaleContactAction() {
  const { user } = useAuth();

  const markAction = async (saleId: string, contactId: string, action: 'contacted' | 'ignored') => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('sale_contact_actions')
      .upsert({
        user_id: user.id,
        sale_id: saleId,
        contact_id: contactId,
        action,
      }, {
        onConflict: 'user_id,sale_id,contact_id',
      });

    if (error) throw error;
  };

  const removeAction = async (saleId: string, contactId: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('sale_contact_actions')
      .delete()
      .eq('user_id', user.id)
      .eq('sale_id', saleId)
      .eq('contact_id', contactId);

    if (error) throw error;
  };

  return { markAction, removeAction };
}
