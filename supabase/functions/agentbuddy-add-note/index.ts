import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddNoteRequest {
  agentbuddy_customer_id: string;
  note_content: string;
  related_property_address?: string;
  note_type?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("AgentBuddy add-note function called");

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
      console.error("Missing authorization header");
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

    if (connError) {
      console.error("Error fetching AgentBuddy connection:", connError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch AgentBuddy connection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connection) {
      console.log("No AgentBuddy connection found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "AgentBuddy not connected", code: "NOT_CONNECTED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: AddNoteRequest = await req.json();
    const { agentbuddy_customer_id, note_content, related_property_address, note_type = "sms_sent" } = body;

    if (!agentbuddy_customer_id || !note_content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: agentbuddy_customer_id, note_content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Adding note to AgentBuddy contact: ${agentbuddy_customer_id}`);

    // Construct the note payload for AgentBuddy webhook
    const notePayload = {
      contact_id: agentbuddy_customer_id,
      event_type: note_type,
      content: note_content,
      related_property_address: related_property_address || null,
      timestamp: new Date().toISOString(),
      source: "broadcast",
    };

    // Call AgentBuddy webhook to log activity
    const agentBuddyApiUrl = Deno.env.get("AGENTBUDDY_API_URL") || "https://api.agentbuddy.com";
    
    const response = await fetch(
      `${agentBuddyApiUrl}/v1/broadcast-webhook`,
      {
        method: "POST",
        headers: {
          "X-API-Key": connection.api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notePayload),
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
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "Contact not found in AgentBuddy", code: "CONTACT_NOT_FOUND" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to add note to AgentBuddy", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Note added successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Note added to AgentBuddy",
        note_id: result.id || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in agentbuddy-add-note function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
