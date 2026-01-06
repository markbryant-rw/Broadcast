import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type Tag = Tables<'tags'>;
type TagInsert = TablesInsert<'tags'>;
type TagUpdate = TablesUpdate<'tags'>;

export function useTags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_TAGS)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  const addTag = useMutation({
    mutationFn: async (tag: Omit<TagInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_TAGS)
        .insert({ ...tag, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: TagUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_TAGS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tag');
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.BROADCAST_TAGS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });

  const assignTagToContact = useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CONTACT_TAGS)
        .insert({ contact_id: contactId, tag_id: tagId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact_tags'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign tag');
    },
  });

  const removeTagFromContact = useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { error } = await supabase
        .from(TABLES.BROADCAST_CONTACT_TAGS)
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact_tags'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove tag');
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    error: tagsQuery.error,
    addTag,
    updateTag,
    deleteTag,
    assignTagToContact,
    removeTagFromContact,
  };
}
