import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("AgentBuddy validate function called");

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

    // Parse request body
    const { api_key } = await req.json();

    if (!api_key || typeof api_key !== 'string' || !api_key.trim()) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validating API key for user:", user.id);

    // TODO: Replace with actual AgentBuddy API validation
    // For now, we validate by attempting to fetch contacts
    const agentBuddyApiUrl = Deno.env.get("AGENTBUDDY_API_URL") || "https://api.agentbuddy.com";
    
    try {
      const validateResponse = await fetch(
        `${agentBuddyApiUrl}/v1/broadcast-get-contacts`,
        {
          method: "POST",
          headers: {
            "X-API-Key": api_key.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ limit: 1 }),
        }
      );

      // For development, accept the key if we can't reach AgentBuddy
      // In production, this should strictly validate
      if (!validateResponse.ok && validateResponse.status !== 0) {
        if (validateResponse.status === 401 || validateResponse.status === 403) {
          console.error("Invalid AgentBuddy API key");
          return new Response(
            JSON.stringify({ error: "Invalid API key" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (fetchError) {
      // If we can't reach the API, log it but continue (for development)
      console.log("Could not reach AgentBuddy API for validation:", fetchError);
    }

    // Store the API key
    const { error: upsertError } = await supabase
      .from("agentbuddy_connections")
      .upsert({
        user_id: user.id,
        api_key: api_key.trim(),
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Error storing API key:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("API key stored successfully for user:", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "AgentBuddy connected" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in AgentBuddy validate function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
