import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SMSTemplate {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  body: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

type SMSTemplateInsert = Omit<SMSTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type SMSTemplateUpdate = Partial<SMSTemplateInsert> & { id: string };

export function useSMSTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['sms-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SMSTemplate[];
    },
    enabled: !!user,
  });

  const addTemplate = useMutation({
    mutationFn: async (template: SMSTemplateInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('sms_templates')
        .insert({ ...template, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: SMSTemplateUpdate) => {
      const { data, error } = await supabase
        .from('sms_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
