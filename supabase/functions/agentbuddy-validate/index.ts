import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENTBUDDY_BASE_URL = "https://mxsefnpxrnamupatgrlb.supabase.co/functions/v1";

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

    // Validate by attempting to fetch one contact
    const validateResponse = await fetch(
      `${AGENTBUDDY_BASE_URL}/broadcast-get-contacts`,
      {
        method: "POST",
        headers: {
          "x-api-key": api_key.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page: 1, pageSize: 1 }),
      }
    );

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text();
      console.error(`AgentBuddy validation failed: ${validateResponse.status} - ${errorText}`);
      
      if (validateResponse.status === 401 || validateResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your key in AgentBuddy Settings." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to validate API key with AgentBuddy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // API key is valid - store it
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

    console.log("API key validated and stored for user:", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "AgentBuddy connected successfully" }),
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
