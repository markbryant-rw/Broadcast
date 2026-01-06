import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  sent_at: string | null;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
}

interface DailyStats {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

export function useAnalytics() {
  const { user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ['analytics-summary', user?.id],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const { data, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGN_ANALYTICS)
        .select(`
          sent_count,
          delivered_count,
          opened_count,
          clicked_count,
          bounced_count,
          unsubscribed_count,
          campaign:campaigns!inner(user_id)
        `);

      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, row) => ({
          totalSent: acc.totalSent + (row.sent_count || 0),
          totalDelivered: acc.totalDelivered + (row.delivered_count || 0),
          totalOpened: acc.totalOpened + (row.opened_count || 0),
          totalClicked: acc.totalClicked + (row.clicked_count || 0),
          totalBounced: acc.totalBounced + (row.bounced_count || 0),
          totalUnsubscribed: acc.totalUnsubscribed + (row.unsubscribed_count || 0),
        }),
        {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalBounced: 0,
          totalUnsubscribed: 0,
        }
      );

      return {
        ...totals,
        openRate: totals.totalDelivered > 0 ? (totals.totalOpened / totals.totalDelivered) * 100 : 0,
        clickRate: totals.totalOpened > 0 ? (totals.totalClicked / totals.totalOpened) * 100 : 0,
        bounceRate: totals.totalSent > 0 ? (totals.totalBounced / totals.totalSent) * 100 : 0,
      };
    },
    enabled: !!user,
  });

  const campaignPerformanceQuery = useQuery({
    queryKey: ['analytics-campaigns', user?.id],
    queryFn: async (): Promise<CampaignPerformance[]> => {
      const { data: campaigns, error: campaignsError } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .select('id, name, sent_at, status')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (campaignsError) throw campaignsError;

      const campaignIds = (campaigns || []).map(c => c.id);
      
      if (campaignIds.length === 0) return [];

      const { data: analytics, error: analyticsError } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGN_ANALYTICS)
        .select('*')
        .in('campaign_id', campaignIds);

      if (analyticsError) throw analyticsError;

      const analyticsMap = new Map((analytics || []).map(a => [a.campaign_id, a]));

      return (campaigns || []).map(campaign => {
        const stats = analyticsMap.get(campaign.id);
        const sentCount = stats?.sent_count || 0;
        const openedCount = stats?.opened_count || 0;
        const clickedCount = stats?.clicked_count || 0;

        return {
          id: campaign.id,
          name: campaign.name,
          sent_at: campaign.sent_at,
          sent_count: sentCount,
          opened_count: openedCount,
          clicked_count: clickedCount,
          open_rate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
          click_rate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
        };
      });
    },
    enabled: !!user,
  });

  const dailyStatsQuery = useQuery({
    queryKey: ['analytics-daily', user?.id],
    queryFn: async (): Promise<DailyStats[]> => {
      // Get last 30 days of email events
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from(TABLES.BROADCAST_EMAIL_EVENTS)
        .select(`
          event_type,
          created_at,
          campaign:campaigns!inner(user_id)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Group by date
      const dailyMap = new Map<string, { sent: number; opened: number; clicked: number }>();

      (data || []).forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { sent: 0, opened: 0, clicked: 0 };

        if (event.event_type === 'sent') existing.sent++;
        if (event.event_type === 'opened') existing.opened++;
        if (event.event_type === 'clicked') existing.clicked++;

        dailyMap.set(date, existing);
      });

      // Fill in missing dates
      const result: DailyStats[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const stats = dailyMap.get(dateStr) || { sent: 0, opened: 0, clicked: 0 };
        result.push({ date: dateStr, ...stats });
      }

      return result;
    },
    enabled: !!user,
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    campaignPerformance: campaignPerformanceQuery.data || [],
    isLoadingCampaigns: campaignPerformanceQuery.isLoading,
    dailyStats: dailyStatsQuery.data || [],
    isLoadingDaily: dailyStatsQuery.isLoading,
  };
}
