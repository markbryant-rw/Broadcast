import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HotOpportunity {
  contactId: string;
  contactName: string;
  contactAddress: string | null;
  contactPhone: string | null;
  saleId: string;
  saleAddress: string;
  salePrice: number | null;
  saleDate: string | null;
  suburb: string;
  daysSinceContact: number | null; // null = never contacted
  lastContactedAt: string | null;
}

export function useHotOpportunities(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hot-opportunities', user?.id, limit],
    queryFn: async (): Promise<HotOpportunity[]> => {
      if (!user?.id) return [];

      // Get recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales, error: salesError } = await supabase
        .from('nearby_sales')
        .select('id, address, suburb, sale_price, sale_date')
        .gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('sale_date', { ascending: false })
        .limit(50);

      if (salesError) {
        console.error('Error fetching recent sales:', salesError);
        throw salesError;
      }

      if (!recentSales || recentSales.length === 0) {
        return [];
      }

      // Get unique suburbs from recent sales
      const suburbs = [...new Set(recentSales.map(s => s.suburb.toLowerCase()))];

      // Get contacts in those suburbs that haven't been contacted recently
      const { data: contacts, error: contactsError } = await supabase
        .from(TABLES.CONTACTS)
        .select('id, first_name, last_name, address, address_suburb, phone, last_sms_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('phone', 'is', null);

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }

      // Filter contacts to those in sale suburbs
      const contactsInSuburbs = (contacts || []).filter(contact => {
        const contactSuburb = contact.address_suburb?.toLowerCase() || '';
        return suburbs.includes(contactSuburb);
      });

      // Build opportunities
      const opportunities: HotOpportunity[] = [];
      const now = new Date();

      for (const contact of contactsInSuburbs) {
        const contactSuburb = contact.address_suburb?.toLowerCase() || '';
        
        // Find matching sales in same suburb
        const matchingSales = recentSales.filter(
          sale => sale.suburb.toLowerCase() === contactSuburb
        );

        if (matchingSales.length === 0) continue;

        // Calculate days since last contact
        let daysSinceContact: number | null = null;
        if (contact.last_sms_at) {
          const lastContact = new Date(contact.last_sms_at);
          daysSinceContact = Math.floor(
            (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Only include if never contacted or contacted > 14 days ago
        if (daysSinceContact !== null && daysSinceContact < 14) {
          continue;
        }

        // Use the most recent sale as the trigger
        const sale = matchingSales[0];

        opportunities.push({
          contactId: contact.id,
          contactName: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown',
          contactAddress: contact.address,
          contactPhone: contact.phone,
          saleId: sale.id,
          saleAddress: sale.address,
          salePrice: sale.sale_price,
          saleDate: sale.sale_date,
          suburb: sale.suburb,
          daysSinceContact,
          lastContactedAt: contact.last_sms_at,
        });
      }

      // Sort: never contacted first, then by longest time since contact
      opportunities.sort((a, b) => {
        if (a.daysSinceContact === null && b.daysSinceContact === null) return 0;
        if (a.daysSinceContact === null) return -1;
        if (b.daysSinceContact === null) return 1;
        return b.daysSinceContact - a.daysSinceContact;
      });

      return opportunities.slice(0, limit);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
