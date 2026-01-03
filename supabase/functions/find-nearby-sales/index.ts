import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NearbySale {
  id: string;
  address: string;
  suburb: string;
  street_name: string;
  sale_price: number;
  sale_date: string;
}

interface ContactMatch {
  contact_id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_address: string;
  contact_suburb: string;
  nearby_sales: NearbySale[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { suburb, days_back = 30 } = await req.json();

    console.log(`Finding nearby sales for user ${user.id}, suburb: ${suburb || 'all'}, days: ${days_back}`);

    // Get contacts with addresses belonging to this user
    let contactsQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, address, address_suburb')
      .eq('user_id', user.id)
      .not('address_suburb', 'is', null);

    if (suburb) {
      contactsQuery = contactsQuery.ilike('address_suburb', `%${suburb}%`);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: 'No contacts with addresses found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${contacts.length} contacts with addresses`);

    // Get recent sales
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_back);
    
    const { data: sales, error: salesError } = await supabase
      .from('nearby_sales')
      .select('*')
      .gte('sale_date', cutoffDate.toISOString().split('T')[0])
      .order('sale_date', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      throw salesError;
    }

    if (!sales || sales.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: 'No recent sales found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${sales.length} recent sales`);

    // Match contacts with nearby sales (same suburb for now, can be enhanced with geo-distance later)
    const matches: ContactMatch[] = [];

    for (const contact of contacts) {
      const nearbySales = sales.filter(sale => 
        sale.suburb?.toLowerCase() === contact.address_suburb?.toLowerCase()
      );

      if (nearbySales.length > 0) {
        matches.push({
          contact_id: contact.id,
          contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
          contact_phone: contact.phone,
          contact_address: contact.address || '',
          contact_suburb: contact.address_suburb || '',
          nearby_sales: nearbySales.map(sale => ({
            id: sale.id,
            address: sale.address,
            suburb: sale.suburb,
            street_name: sale.street_name || '',
            sale_price: sale.sale_price || 0,
            sale_date: sale.sale_date || '',
          })),
        });
      }
    }

    console.log(`Found ${matches.length} contacts with nearby sales`);

    return new Response(
      JSON.stringify({ 
        matches,
        total_contacts: contacts.length,
        total_sales: sales.length,
        matches_found: matches.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-nearby-sales:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
