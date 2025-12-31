import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaignId: string;
  recipientType: 'all' | 'lists' | 'tags' | 'manual';
  listIds?: string[];
  tagIds?: string[];
  contactIds?: string[];
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Initialize Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { campaignId, recipientType, listIds, tagIds, contactIds }: SendCampaignRequest = await req.json();
    console.log(`Starting campaign send: ${campaignId}, type: ${recipientType}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // Get recipients based on selection type
    let recipients: { id: string; email: string; first_name: string | null }[] = [];

    if (recipientType === 'all') {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, email, first_name")
        .eq("status", "active");
      if (error) throw error;
      recipients = data || [];
    } else if (recipientType === 'lists' && listIds?.length) {
      const { data: memberData, error } = await supabase
        .from("contact_list_members")
        .select("contact_id, contacts(id, email, first_name, status)")
        .in("list_id", listIds);
      if (error) throw error;
      recipients = (memberData || [])
        .filter((m: any) => m.contacts?.status === 'active')
        .map((m: any) => ({
          id: m.contacts.id,
          email: m.contacts.email,
          first_name: m.contacts.first_name,
        }));
    } else if (recipientType === 'tags' && tagIds?.length) {
      const { data: tagData, error } = await supabase
        .from("contact_tags")
        .select("contact_id, contacts(id, email, first_name, status)")
        .in("tag_id", tagIds);
      if (error) throw error;
      recipients = (tagData || [])
        .filter((t: any) => t.contacts?.status === 'active')
        .map((t: any) => ({
          id: t.contacts.id,
          email: t.contacts.email,
          first_name: t.contacts.first_name,
        }));
    } else if (recipientType === 'manual' && contactIds?.length) {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, email, first_name")
        .in("id", contactIds)
        .eq("status", "active");
      if (error) throw error;
      recipients = data || [];
    }

    // Remove duplicates
    const uniqueRecipients = Array.from(
      new Map(recipients.map(r => [r.id, r])).values()
    );

    console.log(`Found ${uniqueRecipients.length} unique recipients`);

    if (uniqueRecipients.length === 0) {
      throw new Error("No recipients found for this campaign");
    }

    // Update campaign status to sending
    await supabase
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    // Create campaign analytics record
    await supabase
      .from("campaign_analytics")
      .upsert({
        campaign_id: campaignId,
        total_recipients: uniqueRecipients.length,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        unsubscribed_count: 0,
      }, { onConflict: "campaign_id" });

    // Create campaign recipients records
    const recipientRecords = uniqueRecipients.map(r => ({
      campaign_id: campaignId,
      contact_id: r.id,
    }));
    
    await supabase
      .from("campaign_recipients")
      .upsert(recipientRecords, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });

    // Get email content
    const emailContent = (campaign.content as { html?: string })?.html || "";
    const fromEmail = campaign.from_email || "onboarding@resend.dev";
    const fromName = campaign.from_name || "Newsletter";
    const subject = campaign.subject || "No Subject";

    let sentCount = 0;
    let failedCount = 0;

    // Send emails in batches
    for (const recipient of uniqueRecipients) {
      try {
        // Personalize content
        const personalizedHtml = emailContent
          .replace(/{{first_name}}/g, recipient.first_name || "there")
          .replace(/{{email}}/g, recipient.email);

        // Send email using Resend API directly
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient.email],
            subject: subject,
            html: personalizedHtml,
            headers: {
              "X-Campaign-Id": campaignId,
              "X-Contact-Id": recipient.id,
            },
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${recipient.email}:`, errorData);
          failedCount++;
          continue;
        }

        const emailData = await emailResponse.json();
        console.log(`Email sent to ${recipient.email}, ID: ${emailData?.id}`);

        // Record sent event
        await supabase.from("email_events").insert({
          campaign_id: campaignId,
          contact_id: recipient.id,
          event_type: "sent",
          metadata: { resend_id: emailData?.id },
        });

        // Update recipient record
        await supabase
          .from("campaign_recipients")
          .update({ sent_at: new Date().toISOString() })
          .eq("campaign_id", campaignId)
          .eq("contact_id", recipient.id);

        sentCount++;
      } catch (err) {
        console.error(`Error sending to ${recipient.email}:`, err);
        failedCount++;
      }
    }

    // Update campaign analytics
    await supabase
      .from("campaign_analytics")
      .update({ sent_count: sentCount })
      .eq("campaign_id", campaignId);

    // Update campaign status
    await supabase
      .from("campaigns")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: uniqueRecipients.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
