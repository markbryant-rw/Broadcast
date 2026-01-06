import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    headers?: {
      "X-Campaign-Id"?: string;
      "X-Contact-Id"?: string;
    };
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ResendWebhookPayload = await req.json();
    console.log("Resend webhook received:", payload.type, payload.data.email_id);

    // Get campaign and contact IDs from headers
    const campaignId = payload.data.headers?.["X-Campaign-Id"];
    const contactId = payload.data.headers?.["X-Contact-Id"];

    if (!campaignId || !contactId) {
      console.log("Missing campaign or contact ID in webhook, skipping");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "complained",
    };

    const eventType = eventTypeMap[payload.type];
    if (!eventType) {
      console.log(`Unknown event type: ${payload.type}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Record the event
    const { error: eventError } = await supabase.from("broadcast_email_events").insert({
      campaign_id: campaignId,
      contact_id: contactId,
      event_type: eventType,
      metadata: { resend_event: payload },
    });

    if (eventError) {
      console.error("Error inserting event:", eventError);
    }

    // Update campaign_recipients timestamps
    const timestampField: Record<string, string> = {
      delivered: "delivered_at",
      opened: "opened_at",
      clicked: "clicked_at",
    };

    if (timestampField[eventType]) {
      await supabase
        .from("broadcast_campaign_recipients")
        .update({ [timestampField[eventType]]: new Date().toISOString() })
        .eq("campaign_id", campaignId)
        .eq("contact_id", contactId);
    }

    // Update analytics counts
    const analyticsFieldMap: Record<string, string> = {
      delivered: "delivered_count",
      opened: "opened_count",
      clicked: "clicked_count",
      bounced: "bounced_count",
    };

    if (analyticsFieldMap[eventType]) {
      // Get current count and increment
      const { data: analytics } = await supabase
        .from("broadcast_campaign_analytics")
        .select(analyticsFieldMap[eventType])
        .eq("campaign_id", campaignId)
        .single();

      if (analytics) {
        const currentCount = (analytics as any)[analyticsFieldMap[eventType]] || 0;
        await supabase
          .from("broadcast_campaign_analytics")
          .update({ [analyticsFieldMap[eventType]]: currentCount + 1 })
          .eq("campaign_id", campaignId);
      }
    }

    // Handle bounces - update contact status
    if (eventType === "bounced") {
      await supabase
        .from("contacts")
        .update({ status: "bounced" })
        .eq("id", contactId);
    }

    console.log(`Processed ${eventType} event for campaign ${campaignId}, contact ${contactId}`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in resend-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
