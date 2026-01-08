import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TABLES } from '@/lib/constants/tables';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string | null;
  content: Json;
  html: string | null;
  is_default: boolean | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Pre-designed templates
export const DEFAULT_TEMPLATES = [
  {
    id: "welcome-1",
    name: "Welcome Email",
    category: "Welcome",
    subject: "Welcome to {{company_name}}!",
    content: [],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin-bottom: 10px;">Welcome, {{first_name}}! 👋</h1>
          <p style="color: #666; font-size: 16px;">We're thrilled to have you on board.</p>
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0;">Get Started</h2>
          <p style="margin: 0 0 20px 0; opacity: 0.9;">Here's what you can do next:</p>
          <a href="#" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Explore Now</a>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
          <p>Questions? Reply to this email or contact our support team.</p>
        </div>
      </div>
    `,
  },
  {
    id: "newsletter-1",
    name: "Newsletter",
    category: "Newsletter",
    subject: "This Week's Update",
    content: [],
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <div style="background: #1a1a1a; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Weekly Digest</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: white; border-radius: 8px; padding: 25px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 20px;">📰 Top Story</h2>
            <p style="color: #666; line-height: 1.6; margin: 0;">Your main story content goes here. Make it compelling and valuable for your readers.</p>
            <a href="#" style="display: inline-block; margin-top: 15px; color: #667eea; text-decoration: none; font-weight: 500;">Read more →</a>
          </div>
          <div style="display: grid; gap: 15px;">
            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">🎯 Quick Update #1</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">Brief description of the update.</p>
            </div>
            <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">💡 Quick Update #2</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">Brief description of the update.</p>
            </div>
          </div>
        </div>
        <div style="background: #1a1a1a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    `,
  },
  {
    id: "announcement-1",
    name: "Product Announcement",
    category: "Announcement",
    subject: "Exciting News: {{announcement_title}}",
    content: [],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px;">NEW</span>
          <h1 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 32px;">Something Big is Here</h1>
          <p style="color: #666; font-size: 18px; margin: 0;">We've been working hard on this.</p>
        </div>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <img src="https://via.placeholder.com/540x300/667eea/ffffff?text=Product+Image" alt="Product" style="width: 100%; border-radius: 8px; margin-bottom: 20px;"/>
          <h2 style="color: #1a1a1a; margin: 0 0 15px 0;">Key Features</h2>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Feature one description</li>
            <li>Feature two description</li>
            <li>Feature three description</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Learn More</a>
        </div>
      </div>
    `,
  },
  {
    id: "promo-1",
    name: "Promotional Offer",
    category: "Promotion",
    subject: "🎉 Special Offer Just for You!",
    content: [],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 42px;">50% OFF</h1>
          <p style="color: white; margin: 0; font-size: 18px; opacity: 0.9;">Limited Time Offer</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1a1a1a; text-align: center; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
          <p style="color: #666; text-align: center; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            As a valued member, we're offering you an exclusive discount on our premium plans. Don't miss out!
          </p>
          <div style="background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0 0 5px 0; color: #92400e; font-size: 14px;">Use code:</p>
            <p style="margin: 0; color: #92400e; font-size: 28px; font-weight: bold; letter-spacing: 3px;">SAVE50</p>
          </div>
          <div style="text-align: center;">
            <a href="#" style="display: inline-block; background: #f5576c; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">Shop Now</a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">Offer expires in 48 hours. Terms apply.</p>
        </div>
      </div>
    `,
  },
  {
    id: "simple-1",
    name: "Simple Text",
    category: "Basic",
    subject: "A quick note",
    content: [],
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.8;">Hi {{first_name}},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">
          Just wanted to reach out personally and share some thoughts with you. Sometimes the simplest messages make the biggest impact.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">
          Your message content goes here. Keep it personal, authentic, and valuable for your readers.
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">
          Best regards,<br/>
          <strong>Your Name</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
        <p style="color: #999; font-size: 12px;">
          You received this because you're subscribed to our list. 
          <a href="#" style="color: #999;">Unsubscribe</a>
        </p>
      </div>
    `,
  },
  {
    id: "realestate-1",
    name: "Property Listing",
    category: "Real Estate",
    subject: "New Property Alert: {{property_address}}",
    content: [],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <div style="background: #1e3a5f; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏠 New Listing</h1>
        </div>
        <div style="padding: 0;">
          <img src="https://via.placeholder.com/600x350/e5e7eb/1a1a1a?text=Property+Image" alt="Property" style="width: 100%;"/>
        </div>
        <div style="background: white; padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #1a1a1a; font-size: 28px;">$850,000</h2>
            <span style="background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px;">JUST LISTED</span>
          </div>
          <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">123 Beautiful Street, Suburb NSW 2000</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">4</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Bedrooms</p>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">2</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Bathrooms</p>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">2</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Parking</p>
            </div>
          </div>
          <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0;">
            This stunning family home features modern finishes, open-plan living, and a beautiful outdoor entertaining area. Perfect for families looking for space and style.
          </p>
          <a href="#" style="display: block; background: #1e3a5f; color: white; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold; text-align: center;">View Full Details</a>
        </div>
        <div style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #1a1a1a; font-weight: bold;">{{agent_name}}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">{{agent_phone}} | {{agent_email}}</p>
        </div>
      </div>
    `,
  },
];

export const useTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["emailTemplates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      subject?: string;
      content?: Json;
      html?: string;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .insert({
          name: template.name,
          subject: template.subject || null,
          content: template.content || [],
          html: template.html || null,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save template");
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      subject?: string;
      content?: Json;
      html?: string;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    defaultTemplates: DEFAULT_TEMPLATES,
  };
};
