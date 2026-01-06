import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { TABLES } from '@/lib/constants/tables';

type Campaign = Tables<'campaigns'>;
type CampaignInsert = TablesInsert<'campaigns'>;
type CampaignUpdate = TablesUpdate<'campaigns'>;

export function useCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const addCampaign = useMutation({
    mutationFn: async (campaign: Omit<CampaignInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .insert({ ...campaign, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: CampaignUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });

  const scheduleCampaign = useMutation({
    mutationFn: async ({ id, scheduledAt, timezone }: { id: string; scheduledAt: string; timezone: string }) => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .update({
          scheduled_at: scheduledAt,
          status: 'scheduled',
          content: supabase.rpc ? undefined : undefined, // We'll store timezone in a separate approach
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule campaign');
    },
  });

  const cancelSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .update({
          scheduled_at: null,
          status: 'draft',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Schedule cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel schedule');
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    scheduleCampaign,
    cancelSchedule,
  };
}
