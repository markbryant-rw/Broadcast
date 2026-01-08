import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type ContactList = Tables<'contact_lists'>;
type ContactListInsert = TablesInsert<'contact_lists'>;
type ContactListUpdate = TablesUpdate<'contact_lists'>;

export interface ContactListWithCount extends ContactList {
  member_count: number;
}

export function useContactLists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ['contact_lists', user?.id],
    queryFn: async () => {
      const { data: lists, error: listsError } = await supabase
        .from(TABLES.CONTACT_LISTS)
        .select('*')
        .order('name', { ascending: true });

      if (listsError) throw listsError;

      // Get member counts for each list
      const listsWithCounts = await Promise.all(
        (lists || []).map(async (list) => {
          const { count, error: countError } = await supabase
            .from(TABLES.CONTACT_LIST_MEMBERS)
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          return {
            ...list,
            member_count: countError ? 0 : (count || 0),
          };
        })
      );

      return listsWithCounts as ContactListWithCount[];
    },
    enabled: !!user,
  });

  const addList = useMutation({
    mutationFn: async (list: Omit<ContactListInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from(TABLES.CONTACT_LISTS)
        .insert({ ...list, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      toast.success('List created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create list');
    },
  });

  const updateList = useMutation({
    mutationFn: async ({ id, ...updates }: ContactListUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_LISTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      toast.success('List updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update list');
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.CONTACT_LISTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      toast.success('List deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete list');
    },
  });

  const addContactToList = useMutation({
    mutationFn: async ({ contactId, listId }: { contactId: string; listId: string }) => {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_LIST_MEMBERS)
        .insert({ contact_id: contactId, list_id: listId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add contact to list');
    },
  });

  const removeContactFromList = useMutation({
    mutationFn: async ({ contactId, listId }: { contactId: string; listId: string }) => {
      const { error } = await supabase
        .from(TABLES.CONTACT_LIST_MEMBERS)
        .delete()
        .eq('contact_id', contactId)
        .eq('list_id', listId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove contact from list');
    },
  });

  const addContactsToList = useMutation({
    mutationFn: async ({ contactIds, listId }: { contactIds: string[]; listId: string }) => {
      const inserts = contactIds.map(contactId => ({
        contact_id: contactId,
        list_id: listId,
      }));

      const { error } = await supabase
        .from(TABLES.CONTACT_LIST_MEMBERS)
        .upsert(inserts, { onConflict: 'contact_id,list_id', ignoreDuplicates: true });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_lists'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contacts added to list');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add contacts to list');
    },
  });

  return {
    lists: listsQuery.data || [],
    isLoading: listsQuery.isLoading,
    error: listsQuery.error,
    addList,
    updateList,
    deleteList,
    addContactToList,
    removeContactFromList,
    addContactsToList,
  };
}
