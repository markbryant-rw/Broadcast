export const TABLES = {
  // Broadcast Core (migrated to AgentBuddy DB with broadcast_ prefix)
  BROADCAST_CAMPAIGNS: 'broadcast_campaigns',
  BROADCAST_CAMPAIGN_ANALYTICS: 'broadcast_campaign_analytics',
  BROADCAST_CAMPAIGN_RECIPIENTS: 'broadcast_campaign_recipients',
  BROADCAST_EMAIL_EVENTS: 'broadcast_email_events',
  BROADCAST_EMAIL_TEMPLATES: 'broadcast_email_templates',
  BROADCAST_SMS_TEMPLATES: 'broadcast_sms_templates',
  BROADCAST_SMS_LOGS: 'broadcast_sms_logs',
  BROADCAST_CONTACT_LISTS: 'broadcast_contact_lists',
  BROADCAST_CONTACT_LIST_MEMBERS: 'broadcast_contact_list_members',
  BROADCAST_TAGS: 'broadcast_tags',
  BROADCAST_CONTACT_TAGS: 'broadcast_contact_tags',
  BROADCAST_CONTACT_METADATA: 'broadcast_contact_metadata',

  // Gamification (staying in Broadcast DB for now)
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  USER_SALE_COMPLETIONS: 'user_sale_completions',
  USER_SUBURB_FAVORITES: 'user_suburb_favorites',
  NEARBY_SALES: 'nearby_sales',
  SALE_CONTACT_ACTIONS: 'sale_contact_actions',

  // Shared AgentBuddy tables
  CONTACTS: 'contacts',
  TEAMS: 'teams',
  PROFILES: 'profiles',
  TEAM_MEMBERS: 'team_members',
  ORGANIZATIONS: 'organizations',
  ORGANIZATION_MEMBERS: 'organization_members',
} as const;
