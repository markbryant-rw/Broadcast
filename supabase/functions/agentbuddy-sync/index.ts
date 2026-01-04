import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENTBUDDY_BASE_URL = "https://mxsefnpxrnamupatgrlb.supabase.co/functions/v1";

interface AgentBuddyProperty {
  address: string;
  suburb: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  relationshipType: string;
}

interface AgentBuddyContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  currentAddress: string | null;
  classification: string | null;
  createdAt: string;
  updatedAt: string;
  properties: AgentBuddyProperty[];
}

interface AgentBuddyResponse {
  contacts: AgentBuddyContact[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
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
      .select("api_key, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError || !connection) {
      console.error("No AgentBuddy connection found:", connError);
      return new Response(
        JSON.stringify({ error: "AgentBuddy not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for incremental sync option
    let modifiedSince: string | undefined;
    try {
      const body = await req.json();
      modifiedSince = body.modifiedSince;
    } catch {
      // No body provided, do full sync
    }

    console.log("Syncing contacts for user:", user.id, modifiedSince ? `since ${modifiedSince}` : "(full sync)");

    let synced = 0;
    let errors = 0;
    let page = 1;
    let hasMore = true;
    const pageSize = 100;

    // Paginate through all contacts
    while (hasMore) {
      const requestBody: Record<string, any> = { 
        page,
        pageSize,
      };
      
      if (modifiedSince) {
        requestBody.modifiedSince = modifiedSince;
      }

      console.log(`Fetching page ${page}...`);

      const response = await fetch(
        `${AGENTBUDDY_BASE_URL}/broadcast-get-contacts`,
        {
          method: "POST",
          headers: {
            "x-api-key": connection.api_key,
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
      console.log(`Received ${data.contacts.length} contacts (page ${page}/${data.totalPages})`);
      
      for (const contact of data.contacts) {
        // Get primary property for address info
        const primaryProperty = contact.properties?.[0];
        
        // Upsert contact based on agentbuddy_customer_id
        const { error: upsertError } = await supabase
          .from("contacts")
          .upsert({
            user_id: user.id,
            email: contact.email,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            phone: contact.phone || null,
            address: primaryProperty?.address || contact.currentAddress || null,
            address_suburb: primaryProperty?.suburb || null,
            address_city: primaryProperty?.city || null,
            latitude: primaryProperty?.latitude || null,
            longitude: primaryProperty?.longitude || null,
            agentbuddy_customer_id: contact.id,
            metadata: {
              classification: contact.classification,
              properties: contact.properties,
              agentbuddy_created_at: contact.createdAt,
              agentbuddy_updated_at: contact.updatedAt,
            },
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

      page++;
      hasMore = page <= data.totalPages;
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
