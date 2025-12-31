import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthCallbackRequest {
  code: string;
  state: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("AgentBuddy OAuth function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const agentbuddyClientId = Deno.env.get("AGENTBUDDY_CLIENT_ID");
    const agentbuddyClientSecret = Deno.env.get("AGENTBUDDY_CLIENT_SECRET");

    if (!agentbuddyClientId || !agentbuddyClientSecret) {
      console.error("Missing AgentBuddy OAuth credentials");
      return new Response(
        JSON.stringify({ error: "AgentBuddy OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Generate OAuth URL
    if (action === "authorize") {
      console.log("Generating OAuth authorization URL for user:", user.id);
      
      const redirectUri = `${supabaseUrl}/functions/v1/agentbuddy-oauth?action=callback`;
      const state = btoa(JSON.stringify({ user_id: user.id }));
      const scopes = ["customers:read", "customers:write", "activity:read"];
      
      // This is a mock OAuth URL - replace with actual AgentBuddy OAuth endpoint
      const authUrl = new URL("https://app.agentbuddy.io/oauth/authorize");
      authUrl.searchParams.set("client_id", agentbuddyClientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes.join(" "));
      authUrl.searchParams.set("state", state);

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle OAuth callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return new Response("Missing code or state", { status: 400, headers: corsHeaders });
      }

      const stateData = JSON.parse(atob(state));
      const userId = stateData.user_id;

      console.log("Processing OAuth callback for user:", userId);

      // Exchange code for tokens - mock response for now
      // Replace with actual AgentBuddy token endpoint
      const tokenResponse: TokenResponse = {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        expires_in: 3600,
        token_type: "Bearer",
        scope: "customers:read customers:write activity:read",
      };

      // Store tokens in database
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in || 3600) * 1000);
      
      const { error: upsertError } = await supabase
        .from("agentbuddy_connections")
        .upsert({
          user_id: userId,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || null,
          token_expires_at: expiresAt.toISOString(),
          scopes: tokenResponse.scope?.split(" ") || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        return new Response(
          `<html><body><script>window.close();</script>Error storing connection</body></html>`,
          { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      console.log("OAuth connection stored successfully for user:", userId);

      // Redirect back to app
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'agentbuddy-oauth-success'},'*');window.close();</script>Connection successful! You can close this window.</body></html>`,
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Disconnect
    if (action === "disconnect") {
      console.log("Disconnecting AgentBuddy for user:", user.id);
      
      const { error } = await supabase
        .from("agentbuddy_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error disconnecting:", error);
        return new Response(
          JSON.stringify({ error: "Failed to disconnect" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check connection status
    if (action === "status") {
      const { data, error } = await supabase
        .from("agentbuddy_connections")
        .select("connected_at, scopes, token_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking status:", error);
        return new Response(
          JSON.stringify({ error: "Failed to check status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          connected: !!data,
          connection: data 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in AgentBuddy OAuth function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
