import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SuburbFavorite {
  id: string;
  user_id: string;
  suburb: string;
  city: string | null;
  display_order: number;
  created_at: string;
}

interface SuburbWithCount {
  suburb: string;
  city: string | null;
  saleCount: number;
  isFavorite: boolean;
  displayOrder: number;
  contactedCount: number;
  totalOpportunities: number;
}

export function useFavoriteSuburbs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suburb-favorites', user?.id],
    queryFn: async (): Promise<SuburbFavorite[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_suburb_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useFavoriteSuburbsWithCounts() {
  const { user } = useAuth();
  const { data: favorites = [] } = useFavoriteSuburbs();

  return useQuery({
    queryKey: ['suburb-favorites-with-counts', user?.id, favorites.map(f => f.suburb)],
    queryFn: async (): Promise<SuburbWithCount[]> => {
      if (!user || favorites.length === 0) return [];
      
      // Get sale counts, contact counts, action counts, and completion counts for each favorite suburb
      const suburbCounts = await Promise.all(
        favorites.map(async (fav) => {
          // Get all sales in this suburb
          const { data: salesInSuburb } = await supabase
            .from('nearby_sales')
            .select('id')
            .eq('suburb', fav.suburb);
          
          const saleIds = salesInSuburb?.map(s => s.id) || [];
          const totalSales = saleIds.length;
          
          // Get completed sales count for this suburb
          let completedSalesCount = 0;
          if (saleIds.length > 0) {
            const { count } = await supabase
              .from('user_sale_completions')
              .select('*', { count: 'exact', head: true })
              .in('sale_id', saleIds)
              .eq('user_id', user.id);
            completedSalesCount = count || 0;
          }
          
          // Active sales = total - completed
          const activeSaleCount = totalSales - completedSalesCount;
          
          // Get contact count (opportunities) in this suburb
          const { count: contactCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .ilike('address_suburb', fav.suburb);
          
          // Get contacted/ignored actions count for this suburb
          let contactedCount = 0;
          if (saleIds.length > 0) {
            const { count } = await supabase
              .from('sale_contact_actions')
              .select('*', { count: 'exact', head: true })
              .in('sale_id', saleIds)
              .eq('user_id', user.id);
            contactedCount = count || 0;
          }
          
          return {
            suburb: fav.suburb,
            city: fav.city,
            saleCount: activeSaleCount, // Now shows only active (non-completed) sales
            isFavorite: true,
            displayOrder: fav.display_order,
            contactedCount,
            totalOpportunities: contactCount || 0,
          };
        })
      );

      return suburbCounts.sort((a, b) => a.displayOrder - b.displayOrder);
    },
    enabled: !!user && favorites.length > 0,
  });
}

export function useAvailableSuburbs(searchQuery: string = '') {
  const { user } = useAuth();
  const { data: favorites = [] } = useFavoriteSuburbs();

  return useQuery({
    queryKey: ['available-suburbs', searchQuery],
    queryFn: async (): Promise<SuburbWithCount[]> => {
      if (!user) return [];
      
      // Get distinct suburbs with counts
      const { data, error } = await supabase
        .from('nearby_sales')
        .select('suburb, city');

      if (error) throw error;

      // Group by suburb and count
      const suburbMap = new Map<string, { city: string | null; count: number }>();
      (data || []).forEach(sale => {
        const existing = suburbMap.get(sale.suburb);
        if (existing) {
          existing.count++;
        } else {
          suburbMap.set(sale.suburb, { city: sale.city, count: 1 });
        }
      });

      // Convert to array and filter by search
      const favoriteSuburbs = new Set(favorites.map(f => f.suburb.toLowerCase()));
      const suburbs: SuburbWithCount[] = [];
      
      suburbMap.forEach((value, suburb) => {
        if (!searchQuery || suburb.toLowerCase().includes(searchQuery.toLowerCase())) {
          suburbs.push({
            suburb,
            city: value.city,
            saleCount: value.count,
            isFavorite: favoriteSuburbs.has(suburb.toLowerCase()),
            displayOrder: 0,
            contactedCount: 0,
            totalOpportunities: 0,
          });
        }
      });

      // Sort by sale count descending
      return suburbs.sort((a, b) => b.saleCount - a.saleCount);
    },
    enabled: !!user,
  });
}

export function useAddFavoriteSuburb() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ suburb, city }: { suburb: string; city: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      // Check current count
      const { count } = await supabase
        .from('user_suburb_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count || 0) >= 5) {
        throw new Error('Maximum 5 favorite suburbs allowed');
      }

      // Get max display_order
      const { data: maxOrder } = await supabase
        .from('user_suburb_favorites')
        .select('display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newOrder = (maxOrder?.display_order ?? -1) + 1;

      const { error } = await supabase
        .from('user_suburb_favorites')
        .insert({
          user_id: user.id,
          suburb,
          city,
          display_order: newOrder,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['available-suburbs'] });
      toast({ title: 'Suburb added to favorites' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveFavoriteSuburb() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suburb: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_suburb_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('suburb', suburb);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['available-suburbs'] });
      toast({ title: 'Suburb removed from favorites' });
    },
    onError: () => {
      toast({
        title: 'Error removing suburb',
        variant: 'destructive',
      });
    },
  });
}

export function useReorderFavoriteSuburbs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedSuburbs: string[]) => {
      if (!user) throw new Error('Not authenticated');

      // Update display_order for each suburb
      await Promise.all(
        orderedSuburbs.map((suburb, index) =>
          supabase
            .from('user_suburb_favorites')
            .update({ display_order: index })
            .eq('user_id', user.id)
            .eq('suburb', suburb)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suburb-favorites'] });
    },
  });
}
