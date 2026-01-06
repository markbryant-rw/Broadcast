import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddNoteRequest {
  contact_id: string; // Changed from agentbuddy_customer_id
  message_summary: string;
  message_type?: string;
  property_address?: string;
  external_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("AgentBuddy add-note function called (direct DB access)");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's team_id from team_members or organization_members
    const { data: teamMember } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const teamId = teamMember?.team_id || null;

    // Parse request body
    const body: AddNoteRequest = await req.json();
    const {
      contact_id,
      message_summary,
      message_type = "nearby_sale_notification",
      property_address,
      external_id,
    } = body;

    if (!contact_id || !message_summary) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contact_id, message_summary" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating activity log for contact: ${contact_id}`);

    // Construct the activity note
    const activityNote = property_address
      ? `${message_summary}\n\nProperty: ${property_address}\nType: ${message_type}`
      : `${message_summary}\nType: ${message_type}`;

    // Direct insert to activity_log table
    const { data, error } = await supabaseAdmin
      .from("activity_log")
      .insert({
        contact_id: contact_id,
        activity_type: "campaign_interaction",
        notes: activityNote,
        created_by: user.id,
        team_id: teamId,
        metadata: {
          message_type,
          property_address,
          external_id: external_id || `broadcast-${Date.now()}`,
          source: "broadcast_sms",
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting activity log:", error);

      if (error.code === "23503") { // Foreign key violation
        return new Response(
          JSON.stringify({ error: "Contact not found", code: "CONTACT_NOT_FOUND" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to log activity", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Activity logged successfully:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS activity logged to database",
        activity_id: data.id,
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
