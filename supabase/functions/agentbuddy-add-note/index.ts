import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENTBUDDY_BASE_URL = "https://mxsefnpxrnamupatgrlb.supabase.co/functions/v1";

interface AddNoteRequest {
  agentbuddy_customer_id: string;
  message_summary: string;
  message_type?: string;
  property_address?: string;
  external_id?: string;
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
    const { 
      agentbuddy_customer_id, 
      message_summary, 
      message_type = "nearby_sale_notification",
      property_address,
      external_id,
    } = body;

    if (!agentbuddy_customer_id || !message_summary) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: agentbuddy_customer_id, message_summary" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Logging SMS activity for AgentBuddy contact: ${agentbuddy_customer_id}`);

    // Construct the webhook payload per AgentBuddy API spec
    const webhookPayload = {
      event: "sms_sent",
      data: {
        contactId: agentbuddy_customer_id,
        propertyAddress: property_address || null,
        messageType: message_type,
        messageSummary: message_summary,
        externalId: external_id || `broadcast-${Date.now()}`,
      },
    };

    // Call AgentBuddy webhook to log activity
    const response = await fetch(
      `${AGENTBUDDY_BASE_URL}/broadcast-webhook`,
      {
        method: "POST",
        headers: {
          "x-api-key": connection.api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
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
        JSON.stringify({ error: "Failed to log activity to AgentBuddy", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Activity logged successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "SMS activity logged to AgentBuddy",
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
