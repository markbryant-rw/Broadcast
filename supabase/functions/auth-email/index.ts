import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type: string;
    site_url?: string;
    verification_url?: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload: AuthEmailPayload = await req.json();
    const { user, email_data } = payload;

    console.log("Auth email hook triggered:", email_data.email_action_type);
    console.log("User email:", user.email);

    const firstName = user.user_metadata?.first_name || "there";
    const emailType = email_data.email_action_type;

    // Build verification URL
    let actionUrl = "";
    if (email_data.token_hash) {
      actionUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=${emailType}&redirect_to=${email_data.redirect_to || email_data.site_url || ""}`;
    } else if (email_data.verification_url) {
      actionUrl = email_data.verification_url;
    }

    let subject = "";
    let html = "";

    switch (emailType) {
      case "signup":
      case "confirmation":
        subject = "Confirm your email - Agent Buddy";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Welcome to Agent Buddy! 🎉</h1>
              <p style="color: #666; font-size: 16px;">Hi ${firstName}, thanks for signing up.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <p style="color: white; margin: 0 0 20px 0; font-size: 16px;">Click below to confirm your email address:</p>
              <a href="${actionUrl}" style="display: inline-block; background: white; color: #667eea; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Confirm Email</a>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">— The Agent Buddy Team</p>
            </div>
          </div>
        `;
        break;

      case "recovery":
      case "reset_password":
        subject = "Reset your password - Agent Buddy";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Reset Your Password</h1>
              <p style="color: #666; font-size: 16px;">Hi ${firstName}, we received a request to reset your password.</p>
            </div>
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">Click below to reset your password:</p>
              <a href="${actionUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>If you didn't request this, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
              <p style="margin-top: 20px;">— The Agent Buddy Team</p>
            </div>
          </div>
        `;
        break;

      case "magic_link":
        subject = "Your login link - Agent Buddy";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Your Magic Link</h1>
              <p style="color: #666; font-size: 16px;">Hi ${firstName}, click below to log in to Agent Buddy.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <a href="${actionUrl}" style="display: inline-block; background: white; color: #667eea; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Log In</a>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>This link will expire in 1 hour.</p>
              <p style="margin-top: 20px;">— The Agent Buddy Team</p>
            </div>
          </div>
        `;
        break;

      case "email_change":
        subject = "Confirm your new email - Agent Buddy";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Confirm Email Change</h1>
              <p style="color: #666; font-size: 16px;">Hi ${firstName}, please confirm your new email address.</p>
            </div>
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <a href="${actionUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Confirm New Email</a>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>If you didn't request this change, please contact support immediately.</p>
              <p style="margin-top: 20px;">— The Agent Buddy Team</p>
            </div>
          </div>
        `;
        break;

      default:
        console.log("Unknown email type:", emailType);
        return new Response(JSON.stringify({ error: "Unknown email type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Agent Buddy <noreply@agentbuddy.co>",
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Failed to send email via Resend:", errorData);
      return new Response(JSON.stringify({ error: errorData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await emailResponse.json();
    console.log("Email sent successfully:", data?.id);

    return new Response(JSON.stringify({ success: true, email_id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in auth-email hook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
