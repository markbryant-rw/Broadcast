import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEFAULT_SENDER_DOMAIN = "resend.dev"; // Fallback domain

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

    // Initialize Supabase client with service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Supabase client with user's auth for RLS
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

    // Get organization's verified domains if campaign has organization_id
    let verifiedDomains: string[] = [];
    if (campaign.organization_id) {
      const { data: domains } = await supabaseAdmin
        .from("verified_domains")
        .select("domain")
        .eq("organization_id", campaign.organization_id)
        .not("verified_at", "is", null);
      
      verifiedDomains = (domains || []).map(d => d.domain);
      console.log(`Verified domains for org: ${verifiedDomains.join(", ")}`);
    }

    // Determine sender email and reply-to using Reply-To pattern
    const userFromEmail = campaign.from_email || "";
    const userFromName = campaign.from_name || "Newsletter";
    const userEmailDomain = userFromEmail.split("@")[1] || "";
    
    let senderEmail: string;
    let replyToEmail: string;
    
    // Check if user's domain is verified
    if (verifiedDomains.includes(userEmailDomain)) {
      // User's domain is verified - send directly from their address
      senderEmail = userFromEmail;
      replyToEmail = campaign.reply_to || userFromEmail;
      console.log(`Using verified domain: ${senderEmail}`);
    } else {
      // Use Reply-To pattern: send from app domain, reply-to goes to user
      // Use the first verified domain or fallback to default
      const senderDomain = verifiedDomains[0] || DEFAULT_SENDER_DOMAIN;
      senderEmail = `noreply@${senderDomain}`;
      replyToEmail = userFromEmail || campaign.reply_to || senderEmail;
      console.log(`Using Reply-To pattern: from ${senderEmail}, reply-to ${replyToEmail}`);
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
    await supabaseAdmin
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
    
    await supabaseAdmin
      .from("campaign_recipients")
      .upsert(recipientRecords, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });

    // Get email content
    const emailContent = (campaign.content as { html?: string })?.html || "";
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

        // Build the from field with display name
        // If using Reply-To pattern, include user's name in display
        const fromField = verifiedDomains.includes(userEmailDomain)
          ? `${userFromName} <${senderEmail}>`
          : `${userFromName} via Broadcast <${senderEmail}>`;

        // Send email using Resend API
        const emailPayload: any = {
          from: fromField,
          to: [recipient.email],
          subject: subject,
          html: personalizedHtml,
          headers: {
            "X-Campaign-Id": campaignId,
            "X-Contact-Id": recipient.id,
          },
        };

        // Add reply-to if different from sender
        if (replyToEmail && replyToEmail !== senderEmail) {
          emailPayload.reply_to = replyToEmail;
        }

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
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
        await supabaseAdmin.from("email_events").insert({
          campaign_id: campaignId,
          contact_id: recipient.id,
          event_type: "sent",
          metadata: { resend_id: emailData?.id },
        });

        // Update recipient record
        await supabaseAdmin
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
    await supabaseAdmin
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
        senderEmail,
        replyToEmail,
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
