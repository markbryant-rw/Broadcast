export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          key: string
          name: string
          rarity: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          key: string
          name: string
          rarity?: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      agentbuddy_connections: {
        Row: {
          api_key: string
          connected_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          connected_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          connected_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          bounced_count: number | null
          campaign_id: string
          clicked_count: number | null
          delivered_count: number | null
          id: string
          opened_count: number | null
          sent_count: number | null
          total_recipients: number | null
          unsubscribed_count: number | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number | null
          campaign_id: string
          clicked_count?: number | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          sent_count?: number | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number | null
          campaign_id?: string
          clicked_count?: number | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          sent_count?: number | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          delivered_at: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          content: Json | null
          created_at: string
          from_email: string | null
          from_name: string | null
          id: string
          name: string
          organization_id: string | null
          reply_to: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          name: string
          organization_id?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_list_members: {
        Row: {
          added_at: string
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "contact_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          address_city: string | null
          address_suburb: string | null
          agentbuddy_customer_id: string | null
          created_at: string
          email: string
          first_name: string | null
          geocoded_at: string | null
          id: string
          last_name: string | null
          last_sms_at: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          organization_id: string | null
          phone: string | null
          plan_name: string | null
          status: Database["public"]["Enums"]["contact_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_suburb?: string | null
          agentbuddy_customer_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          geocoded_at?: string | null
          id?: string
          last_name?: string | null
          last_sms_at?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          organization_id?: string | null
          phone?: string | null
          plan_name?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_suburb?: string | null
          agentbuddy_customer_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          geocoded_at?: string | null
          id?: string
          last_name?: string | null
          last_sms_at?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          organization_id?: string | null
          phone?: string | null
          plan_name?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id: string
          metadata: Json | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: Json
          created_at: string
          html: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          html?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          html?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nearby_sales: {
        Row: {
          address: string
          bedrooms: number | null
          city: string
          created_at: string
          days_to_sell: number | null
          floor_area: number | null
          geocoded_at: string | null
          id: string
          land_area: number | null
          latitude: number | null
          longitude: number | null
          property_type: string | null
          reinz_id: string | null
          sale_date: string | null
          sale_price: number | null
          source_file: string | null
          street_name: string | null
          street_number: string | null
          suburb: string
          synced_at: string | null
          valuation: number | null
        }
        Insert: {
          address: string
          bedrooms?: number | null
          city: string
          created_at?: string
          days_to_sell?: number | null
          floor_area?: number | null
          geocoded_at?: string | null
          id?: string
          land_area?: number | null
          latitude?: number | null
          longitude?: number | null
          property_type?: string | null
          reinz_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          source_file?: string | null
          street_name?: string | null
          street_number?: string | null
          suburb: string
          synced_at?: string | null
          valuation?: number | null
        }
        Update: {
          address?: string
          bedrooms?: number | null
          city?: string
          created_at?: string
          days_to_sell?: number | null
          floor_area?: number | null
          geocoded_at?: string | null
          id?: string
          land_area?: number | null
          latitude?: number | null
          longitude?: number | null
          property_type?: string | null
          reinz_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          source_file?: string | null
          street_name?: string | null
          street_number?: string | null
          suburb?: string
          synced_at?: string | null
          valuation?: number | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_contact_actions: {
        Row: {
          action: string
          contact_id: string
          created_at: string
          id: string
          sale_id: string
          user_id: string
        }
        Insert: {
          action: string
          contact_id: string
          created_at?: string
          id?: string
          sale_id: string
          user_id: string
        }
        Update: {
          action?: string
          contact_id?: string
          created_at?: string
          id?: string
          sale_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_contact_actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_contact_actions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "nearby_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          message_body: string
          organization_id: string | null
          phone_number: string
          related_property_id: string | null
          related_sale_id: string | null
          sent_at: string
          template_id: string | null
          trigger_property_address: string | null
          trigger_type: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          message_body: string
          organization_id?: string | null
          phone_number: string
          related_property_id?: string | null
          related_sale_id?: string | null
          sent_at?: string
          template_id?: string | null
          trigger_property_address?: string | null
          trigger_type?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          message_body?: string
          organization_id?: string | null
          phone_number?: string
          related_property_id?: string | null
          related_sale_id?: string | null
          sent_at?: string
          template_id?: string | null
          trigger_property_address?: string | null
          trigger_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_related_sale_id_fkey"
            columns: ["related_sale_id"]
            isOneToOne: false
            referencedRelation: "nearby_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sale_completions: {
        Row: {
          completed_at: string
          id: string
          sale_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          sale_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          sale_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sale_completions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "nearby_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      user_suburb_favorites: {
        Row: {
          city: string | null
          created_at: string | null
          display_order: number | null
          id: string
          suburb: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          suburb: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          suburb?: string
          user_id?: string
        }
        Relationships: []
      }
      verified_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          organization_id: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          organization_id: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          organization_id?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          direction: string
          event_type: string
          id: string
          payload: Json
          response: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          event_type: string
          id?: string
          payload: Json
          response?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          event_type?: string
          id?: string
          payload?: Json
          response?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member" | "platform_admin"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "paused"
        | "cancelled"
      contact_status: "active" | "unsubscribed" | "bounced" | "archived"
      email_event_type:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "unsubscribed"
        | "complained"
      org_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "platform_admin"],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "paused",
        "cancelled",
      ],
      contact_status: ["active", "unsubscribed", "bounced", "archived"],
      email_event_type: [
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "unsubscribed",
        "complained",
      ],
      org_role: ["owner", "admin", "member"],
    },
  },
} as const
