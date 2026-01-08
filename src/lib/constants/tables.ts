export const TABLES = {
  // Core tables (original names in Supabase)
  CAMPAIGNS: 'campaigns',
  CAMPAIGN_ANALYTICS: 'campaign_analytics',
  CAMPAIGN_RECIPIENTS: 'campaign_recipients',
  EMAIL_EVENTS: 'email_events',
  EMAIL_TEMPLATES: 'email_templates',
  SMS_TEMPLATES: 'sms_templates',
  SMS_LOGS: 'sms_logs',
  CONTACT_LISTS: 'contact_lists',
  CONTACT_LIST_MEMBERS: 'contact_list_members',
  TAGS: 'tags',
  CONTACT_TAGS: 'contact_tags',

  // Gamification
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  USER_SALE_COMPLETIONS: 'user_sale_completions',
  USER_SUBURB_FAVORITES: 'user_suburb_favorites',
  NEARBY_SALES: 'nearby_sales',
  SALE_CONTACT_ACTIONS: 'sale_contact_actions',

  // Shared tables
  CONTACTS: 'contacts',
  PROFILES: 'profiles',
  ORGANIZATIONS: 'organizations',
  ORGANIZATION_MEMBERS: 'organization_members',
} as const;
