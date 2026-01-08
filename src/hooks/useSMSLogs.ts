import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SMSLog {
  id: string;
  user_id: string;
  contact_id: string | null;
  organization_id: string | null;
  phone_number: string;
  message_body: string;
  template_id: string | null;
  trigger_type: string | null;
  trigger_property_address: string | null;
  related_property_id: string | null;
  sent_at: string;
  created_at: string;
}

export interface SMSLogWithContact extends SMSLog {
  contacts?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

type SMSLogInsert = {
  contact_id?: string;
  phone_number: string;
  message_body: string;
  template_id?: string;
  trigger_type?: string;
  trigger_property_address?: string;
  related_property_id?: string;
  related_sale_id?: string;
};

export function useSMSLogs(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['sms-logs', user?.id, contactId],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.SMS_LOGS)
        .select(`
          *,
          contacts (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('sent_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as SMSLogWithContact[];
    },
    enabled: !!user,
  });

  const logSMS = useMutation({
    mutationFn: async (log: SMSLogInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from(TABLES.SMS_LOGS)
        .insert({ ...log, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log SMS');
    },
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    logSMS,
  };
}
