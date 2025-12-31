import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentBuddyCustomer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  plan_name?: string;
  metadata?: Record<string, any>;
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

    // Get AgentBuddy connection
    const { data: connection, error: connError } = await supabase
      .from("agentbuddy_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError || !connection) {
      console.error("No AgentBuddy connection found:", connError);
      return new Response(
        JSON.stringify({ error: "AgentBuddy not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Syncing customers for user:", user.id);

    // Mock customer data - replace with actual AgentBuddy API call
    const mockCustomers: AgentBuddyCustomer[] = [
      {
        id: "cust_001",
        email: "john@example.com",
        first_name: "John",
        last_name: "Doe",
        plan_name: "Pro",
      },
      {
        id: "cust_002",
        email: "jane@example.com",
        first_name: "Jane",
        last_name: "Smith",
        plan_name: "Enterprise",
      },
      {
        id: "cust_003",
        email: "bob@example.com",
        first_name: "Bob",
        last_name: "Wilson",
        plan_name: "Starter",
      },
    ];

    let synced = 0;
    let errors = 0;

    for (const customer of mockCustomers) {
      // Upsert contact based on email
      const { error: upsertError } = await supabase
        .from("contacts")
        .upsert({
          user_id: user.id,
          email: customer.email,
          first_name: customer.first_name || null,
          last_name: customer.last_name || null,
          plan_name: customer.plan_name || null,
          agentbuddy_customer_id: customer.id,
          metadata: customer.metadata || {},
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

    console.log(`Sync complete: ${synced} synced, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        synced,
        errors,
        total: mockCustomers.length
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
