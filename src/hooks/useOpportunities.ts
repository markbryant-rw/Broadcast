import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NearbySale } from './useNearbySales';

export interface Opportunity {
  contact: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    address: string | null;
    address_suburb: string | null;
    last_sms_at: string | null;
    agentbuddy_customer_id: string | null;
  };
  distance: number | null; // Estimated distance in meters
  sameStreet: boolean;
  daysSinceContact: number | null;
  neverContacted: boolean;
}

export interface SaleWithOpportunities extends NearbySale {
  opportunities: Opportunity[];
  opportunityCount: number;
}

// Parse street number from address
function parseStreetNumber(address: string | null): number | null {
  if (!address) return null;
  const match = address.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Estimate distance based on street numbers (rough approximation: ~10m per house number)
function estimateDistance(
  saleStreetNumber: number | null,
  contactStreetNumber: number | null
): number | null {
  if (saleStreetNumber === null || contactStreetNumber === null) return null;
  return Math.abs(saleStreetNumber - contactStreetNumber) * 10;
}

// Check if two addresses are on the same street
function isSameStreet(
  saleStreetName: string | null,
  contactAddress: string | null
): boolean {
  if (!saleStreetName || !contactAddress) return false;
  return contactAddress.toLowerCase().includes(saleStreetName.toLowerCase());
}

export function useOpportunitiesForSale(sale: NearbySale | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['opportunities', sale?.id, user?.id],
    queryFn: async () => {
      if (!sale) return [];

      // Get contacts in the same suburb
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, phone, address, address_suburb, last_sms_at, agentbuddy_customer_id')
        .ilike('address_suburb', sale.suburb);

      if (error) throw error;
      if (!contacts || contacts.length === 0) return [];

      const saleStreetNumber = parseStreetNumber(sale.street_number || sale.address);

      const opportunities: Opportunity[] = contacts.map(contact => {
        const contactStreetNumber = parseStreetNumber(contact.address);
        const sameStreet = isSameStreet(sale.street_name, contact.address);
        const distance = sameStreet 
          ? estimateDistance(saleStreetNumber, contactStreetNumber)
          : null;

        const daysSinceContact = contact.last_sms_at
          ? Math.floor(
              (Date.now() - new Date(contact.last_sms_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return {
          contact,
          distance,
          sameStreet,
          daysSinceContact,
          neverContacted: contact.last_sms_at === null,
        };
      });

      // Sort by: same street first, then by distance, then by never contacted
      return opportunities.sort((a, b) => {
        // Same street first
        if (a.sameStreet && !b.sameStreet) return -1;
        if (!a.sameStreet && b.sameStreet) return 1;

        // Never contacted first
        if (a.neverContacted && !b.neverContacted) return -1;
        if (!a.neverContacted && b.neverContacted) return 1;

        // Then by distance (if available)
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }

        // Then by days since contact (longer = higher priority)
        if (a.daysSinceContact !== null && b.daysSinceContact !== null) {
          return b.daysSinceContact - a.daysSinceContact;
        }

        return 0;
      });
    },
    enabled: !!sale && !!user,
  });
}

// Get contact counts per suburb (cached separately)
export function useSuburbContactCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suburb-contact-counts', user?.id],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('address_suburb')
        .not('address_suburb', 'is', null);

      if (error) throw error;

      // Count contacts per suburb
      const counts: Record<string, number> = {};
      contacts?.forEach(c => {
        const suburb = c.address_suburb?.toLowerCase() || '';
        counts[suburb] = (counts[suburb] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Combine sales with opportunity counts using cached suburb counts
export function useSalesWithOpportunities(sales: NearbySale[]) {
  const { data: suburbCounts = {} } = useSuburbContactCounts();

  const salesWithOpportunities: SaleWithOpportunities[] = sales.map(sale => ({
    ...sale,
    opportunities: [],
    opportunityCount: suburbCounts[sale.suburb.toLowerCase()] || 0,
  }));

  return {
    data: salesWithOpportunities,
    isLoading: false,
  };
}

// Get unique suburbs from sales
export function useSuburbsList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suburbs-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nearby_sales')
        .select('suburb')
        .order('suburb');

      if (error) throw error;

      // Get unique suburbs
      const suburbs = [...new Set(data?.map(s => s.suburb) || [])];
      return suburbs.sort();
    },
    enabled: !!user,
  });
}
