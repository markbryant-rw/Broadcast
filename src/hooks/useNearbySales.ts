import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NearbySale {
  id: string;
  address: string;
  suburb: string;
  city: string;
  sale_price: number | null;
  sale_date: string | null;
  property_type: string | null;
  street_name: string | null;
  street_number: string | null;
  reinz_id: string | null;
  synced_at: string | null;
  created_at: string;
  bedrooms: number | null;
  floor_area: number | null;
  land_area: number | null;
  days_to_sell: number | null;
  valuation: number | null;
}

const PAGE_SIZE = 20;

export function useNearbySales(suburb?: string) {
  const { user } = useAuth();

  const salesQuery = useQuery({
    queryKey: ['nearby-sales', suburb],
    queryFn: async () => {
      let query = supabase
        .from('nearby_sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .limit(50);

      if (suburb) {
        query = query.ilike('suburb', `%${suburb}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NearbySale[];
    },
    enabled: !!user,
  });

  return {
    sales: salesQuery.data || [],
    isLoading: salesQuery.isLoading,
    error: salesQuery.error,
  };
}

// Paginated version for infinite scroll
export function useNearbySalesPaginated(suburb?: string) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['nearby-sales-paginated', suburb],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('nearby_sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (suburb) {
        query = query.ilike('suburb', `%${suburb}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return {
        sales: data as NearbySale[],
        nextPage: data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!user,
  });
}

// Find contacts that have nearby sales based on street matching
export function useContactsWithNearbySales() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts-with-nearby-sales', user?.id],
    queryFn: async () => {
      // Get contacts with addresses
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, phone, address, address_suburb')
        .not('address_suburb', 'is', null);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) return [];

      // Get recent sales
      const { data: sales, error: salesError } = await supabase
        .from('nearby_sales')
        .select('*')
        .gte('sale_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;
      if (!sales || sales.length === 0) return [];

      // Match contacts with nearby sales (same suburb)
      const matches = contacts
        .map(contact => {
          const nearbySales = sales.filter(sale => 
            sale.suburb?.toLowerCase() === contact.address_suburb?.toLowerCase()
          );
          return nearbySales.length > 0 ? { contact, nearbySales } : null;
        })
        .filter(Boolean);

      return matches;
    },
    enabled: !!user,
  });
}
