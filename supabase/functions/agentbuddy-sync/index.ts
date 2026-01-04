import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentBuddyContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  suburb?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

interface AgentBuddyResponse {
  contacts: AgentBuddyContact[];
  next_cursor?: string;
  has_more: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("AgentBuddy sync function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AgentBuddy connection with API key
    const { data: connection, error: connError } = await supabase
      .from("agentbuddy_connections")
      .select("api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError || !connection) {
      console.error("No AgentBuddy connection found:", connError);
      return new Response(
        JSON.stringify({ error: "AgentBuddy not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Syncing contacts for user:", user.id);

    const agentBuddyApiUrl = Deno.env.get("AGENTBUDDY_API_URL") || "https://api.agentbuddy.com";
    
    let synced = 0;
    let errors = 0;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    // Paginate through all contacts
    while (hasMore) {
      const requestBody: Record<string, any> = { limit: 500 };
      if (cursor) {
        requestBody.cursor = cursor;
      }

      const response = await fetch(
        `${agentBuddyApiUrl}/v1/broadcast-get-contacts`,
        {
          method: "POST",
          headers: {
            "X-API-Key": connection.api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AgentBuddy API error: ${response.status} - ${errorText}`);
        
        if (response.status === 401 || response.status === 403) {
          return new Response(
            JSON.stringify({ error: "AgentBuddy API key is invalid or expired" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "Failed to fetch contacts from AgentBuddy" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data: AgentBuddyResponse = await response.json();
      
      for (const contact of data.contacts) {
        // Upsert contact based on email
        const { error: upsertError } = await supabase
          .from("contacts")
          .upsert({
            user_id: user.id,
            email: contact.email,
            first_name: contact.first_name || null,
            last_name: contact.last_name || null,
            phone: contact.phone || null,
            address: contact.address || null,
            address_suburb: contact.suburb || null,
            address_city: contact.city || null,
            latitude: contact.latitude || null,
            longitude: contact.longitude || null,
            agentbuddy_customer_id: contact.id,
            metadata: contact.metadata || {},
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: "user_id,email",
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error("Error upserting contact:", upsertError);
          errors++;
        } else {
          synced++;
        }
      }

      cursor = data.next_cursor;
      hasMore = data.has_more && !!cursor;
    }

    console.log(`Sync complete: ${synced} synced, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        synced,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in AgentBuddy sync function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
