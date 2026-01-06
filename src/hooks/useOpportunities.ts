import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NearbySale } from './useNearbySales';

export type RelevanceLevel = 'high' | 'medium' | 'low';
export type SortMode = 'smartmatch' | 'proximity';
export type ActionStatus = 'contacted' | 'ignored' | null;

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
    latitude: number | null;
    longitude: number | null;
    metadata?: { bedrooms?: number } | null;
  };
  distance: number | null; // Estimated distance in meters
  sameStreet: boolean;
  sameBedrooms: boolean; // NEW: same bedroom count as sale
  daysSinceContact: number | null;
  neverContacted: boolean;
  isOnCooldown: boolean;
  cooldownDaysRemaining: number | null;
  relevance: RelevanceLevel;
  matchScore: number; // NEW: combined relevance score
  actionStatus: ActionStatus; // NEW: whether this contact has been actioned for this sale
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

// Determine relevance based on proximity and bedroom match
function getRelevance(
  sameStreet: boolean,
  distance: number | null,
  sameBedrooms: boolean
): RelevanceLevel {
  if (sameStreet && sameBedrooms) {
    // Same street + same bedrooms = best match
    if (distance !== null && distance <= 200) return 'high';
    return 'high';
  }
  if (sameStreet) {
    // Same street, different bedrooms
    if (distance !== null && distance <= 200) return 'high';
    return 'medium';
  }
  if (sameBedrooms) {
    // Same bedrooms but different street - still good
    return 'medium';
  }
  // Different street and different bedrooms
  return 'low';
}

// Calculate a match score for sorting (higher = better match)
function calculateMatchScore(
  sameStreet: boolean,
  distance: number | null,
  sameBedrooms: boolean,
  neverContacted: boolean
): number {
  let score = 0;
  
  // Same street is important
  if (sameStreet) score += 50;
  
  // Same bedrooms is important
  if (sameBedrooms) score += 40;
  
  // Closer distance is better (within same street)
  if (distance !== null) {
    if (distance <= 50) score += 30;
    else if (distance <= 100) score += 25;
    else if (distance <= 200) score += 20;
    else if (distance <= 500) score += 10;
  }
  
  // Never contacted gets priority
  if (neverContacted) score += 20;
  
  return score;
}

// Sort opportunities by given mode
function sortOpportunities(opportunities: Opportunity[], sortMode: SortMode): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    // Always put non-actioned items first
    if (!a.actionStatus && b.actionStatus) return -1;
    if (a.actionStatus && !b.actionStatus) return 1;
    
    // Not on cooldown first
    if (!a.isOnCooldown && b.isOnCooldown) return -1;
    if (a.isOnCooldown && !b.isOnCooldown) return 1;

    if (sortMode === 'proximity') {
      // Sort by distance (closest first)
      if (a.distance === null && b.distance !== null) return 1;
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // If same distance, use matchScore as tiebreaker
      return b.matchScore - a.matchScore;
    }

    // SmartMatch: sort by matchScore (higher = better)
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    // Then by days since contact (longer = higher priority)
    if (a.daysSinceContact !== null && b.daysSinceContact !== null) {
      return b.daysSinceContact - a.daysSinceContact;
    }

    return 0;
  });
}

export function useOpportunitiesForSale(
  sale: NearbySale | null, 
  cooldownDays: number = 7,
  sortMode: SortMode = 'smartmatch'
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['opportunities-for-sale', sale?.id, user?.id, cooldownDays, sortMode],
    queryFn: async () => {
      if (!sale) return [];

      // Get contacts in the same suburb
      const { data: contacts, error } = await supabase
        .from(TABLES.CONTACTS)
        .select('id, email, first_name, last_name, phone, address, address_suburb, last_sms_at, metadata, latitude, longitude')
        .eq('user_id', user!.id)
        .ilike('address_suburb', sale.suburb);

      if (error) throw error;
      if (!contacts || contacts.length === 0) return [];

      // Fetch existing actions for this sale
      const { data: actions, error: actionsError } = await supabase
        .from('sale_contact_actions')
        .select('contact_id, action')
        .eq('sale_id', sale.id)
        .eq('user_id', user!.id);

      if (actionsError) throw actionsError;

      // Create action map
      const actionMap = new Map<string, ActionStatus>(
        actions?.map(a => [a.contact_id, a.action as ActionStatus]) || []
      );

      const saleStreetNumber = parseStreetNumber(sale.street_number || sale.address);
      const saleBedrooms = sale.bedrooms;

      const opportunities: Opportunity[] = contacts.map(contact => {
        const contactStreetNumber = parseStreetNumber(contact.address);
        const sameStreet = isSameStreet(sale.street_name, contact.address);
        const distance = sameStreet 
          ? estimateDistance(saleStreetNumber, contactStreetNumber)
          : null;

        // Check bedroom match
        const contactMetadata = contact.metadata as { bedrooms?: number } | null;
        const contactBedrooms = contactMetadata?.bedrooms;
        const sameBedrooms = saleBedrooms !== null && contactBedrooms !== undefined && saleBedrooms === contactBedrooms;

        const daysSinceContact = contact.last_sms_at
          ? Math.floor(
              (Date.now() - new Date(contact.last_sms_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const neverContacted = contact.last_sms_at === null;
        const isOnCooldown = !neverContacted && daysSinceContact !== null && daysSinceContact < cooldownDays;
        const cooldownDaysRemaining = isOnCooldown && daysSinceContact !== null
          ? cooldownDays - daysSinceContact
          : null;

        const relevance = getRelevance(sameStreet, distance, sameBedrooms);
        const matchScore = calculateMatchScore(sameStreet, distance, sameBedrooms, neverContacted);
        const actionStatus = actionMap.get(contact.id) || null;

        return {
          contact: {
            ...contact,
            metadata: contactMetadata,
          },
          distance,
          sameStreet,
          sameBedrooms,
          daysSinceContact,
          neverContacted,
          isOnCooldown,
          cooldownDaysRemaining,
          relevance,
          matchScore,
          actionStatus,
        };
      });

      return sortOpportunities(opportunities, sortMode);
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
        .from(TABLES.CONTACTS)
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
