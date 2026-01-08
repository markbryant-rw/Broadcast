import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format } from 'date-fns';

interface ProspectingStats {
  thisWeek: {
    contacted: number;
    ignored: number;
    smsSent: number;
    suburbsCovered: number;
  };
  lastWeek: {
    contacted: number;
    ignored: number;
    smsSent: number;
    suburbsCovered: number;
  };
  thisMonth: {
    contacted: number;
    ignored: number;
    smsSent: number;
    suburbsCovered: number;
  };
  lastMonth: {
    contacted: number;
    ignored: number;
    smsSent: number;
    suburbsCovered: number;
  };
  weeklyTrend: { date: string; contacted: number; sms: number }[];
}

export function useProspectingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['prospecting-stats', user?.id],
    queryFn: async (): Promise<ProspectingStats> => {
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch all sale_contact_actions for the user
      const { data: actions, error: actionsError } = await supabase
        .from('sale_contact_actions')
        .select('action, created_at, sale_id')
        .eq('user_id', user.id)
        .gte('created_at', lastMonthStart.toISOString());

      if (actionsError) throw actionsError;

      // Fetch SMS logs
      const { data: smsLogs, error: smsError } = await supabase
        .from(TABLES.SMS_LOGS)
        .select('sent_at, related_sale_id')
        .eq('user_id', user.id)
        .gte('sent_at', lastMonthStart.toISOString());

      if (smsError) throw smsError;

      // Fetch sales for suburb info
      const saleIds = [...new Set([
        ...(actions?.map(a => a.sale_id) || []),
        ...(smsLogs?.map(s => s.related_sale_id).filter(Boolean) || [])
      ])];

      const { data: sales } = await supabase
        .from('nearby_sales')
        .select('id, suburb')
        .in('id', saleIds.length > 0 ? saleIds : ['00000000-0000-0000-0000-000000000000']);

      const saleSuburbMap = new Map(sales?.map(s => [s.id, s.suburb]) || []);

      // Helper to calculate stats for a date range
      const calcStats = (start: Date, end: Date) => {
        const rangeActions = actions?.filter(a => {
          const d = new Date(a.created_at);
          return d >= start && d <= end;
        }) || [];

        const rangeSms = smsLogs?.filter(s => {
          const d = new Date(s.sent_at);
          return d >= start && d <= end;
        }) || [];

        const suburbs = new Set<string>();
        rangeActions.forEach(a => {
          const suburb = saleSuburbMap.get(a.sale_id);
          if (suburb) suburbs.add(suburb.toLowerCase());
        });
        rangeSms.forEach(s => {
          if (s.related_sale_id) {
            const suburb = saleSuburbMap.get(s.related_sale_id);
            if (suburb) suburbs.add(suburb.toLowerCase());
          }
        });

        return {
          contacted: rangeActions.filter(a => a.action === 'contacted').length,
          ignored: rangeActions.filter(a => a.action === 'ignored').length,
          smsSent: rangeSms.length,
          suburbsCovered: suburbs.size,
        };
      };

      // Calculate weekly trend (last 4 weeks)
      const weeklyTrend: { date: string; contacted: number; sms: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        
        const weekActions = actions?.filter(a => {
          const d = new Date(a.created_at);
          return d >= weekStart && d <= weekEnd;
        }) || [];

        const weekSms = smsLogs?.filter(s => {
          const d = new Date(s.sent_at);
          return d >= weekStart && d <= weekEnd;
        }) || [];

        weeklyTrend.push({
          date: format(weekStart, 'MMM d'),
          contacted: weekActions.filter(a => a.action === 'contacted').length,
          sms: weekSms.length,
        });
      }

      return {
        thisWeek: calcStats(thisWeekStart, thisWeekEnd),
        lastWeek: calcStats(lastWeekStart, lastWeekEnd),
        thisMonth: calcStats(thisMonthStart, thisMonthEnd),
        lastMonth: calcStats(lastMonthStart, lastMonthEnd),
        weeklyTrend,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
