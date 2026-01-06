import { useQuery } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LeaderboardEntry {
  user_id: string;
  message_count: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

type TimeRange = 'week' | 'month' | 'all';

const rankStyles = [
  { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10' },
];

export default function WeeklyLeaderboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userOrg } = useQuery({
    queryKey: ['user-organization', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      return data?.organization_id;
    },
    enabled: !!currentUser,
  });

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', userOrg, timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (timeRange === 'week') {
        startDate = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
        endDate = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      } else if (timeRange === 'month') {
        startDate = startOfMonth(now).toISOString();
        endDate = endOfMonth(now).toISOString();
      }

      // Get SMS counts grouped by user
      let query = supabase
        .from(TABLES.BROADCAST_SMS_LOGS)
        .select('user_id');

      if (startDate && endDate) {
        query = query.gte('sent_at', startDate).lte('sent_at', endDate);
      }

      if (userOrg) {
        query = query.eq('organization_id', userOrg);
      }

      const { data: logs } = await query;
      if (!logs || logs.length === 0) return [];

      // Count messages per user
      const userCounts: Record<string, number> = {};
      logs.forEach(log => {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });

      // Get user profiles
      const userIds = Object.keys(userCounts);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      // Build leaderboard
      const leaderboardData: LeaderboardEntry[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        return {
          user_id: userId,
          message_count: userCounts[userId],
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          email: profile?.email || 'Unknown',
        };
      });

      // Sort by message count descending
      return leaderboardData.sort((a, b) => b.message_count - a.message_count).slice(0, 5);
    },
    enabled: !!currentUser,
  });

  const timeRangeLabels: Record<TimeRange, string> = {
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

  const renderLeaderboardContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity {timeRangeLabels[timeRange].toLowerCase()} yet.</p>
          <p className="text-xs mt-1">Be the first to send a message!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUser?.id;
          const RankIcon = rankStyles[index]?.icon;
          const displayName = entry.first_name 
            ? `${entry.first_name} ${entry.last_name || ''}`.trim()
            : entry.email.split('@')[0];
          const initials = entry.first_name 
            ? `${entry.first_name[0]}${entry.last_name?.[0] || ''}`
            : entry.email[0].toUpperCase();

          return (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Rank */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                rankStyles[index]?.bg || 'bg-muted'
              )}>
                {RankIcon ? (
                  <RankIcon className={cn('h-4 w-4', rankStyles[index]?.color)} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-secondary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  isCurrentUser && 'text-primary'
                )}>
                  {displayName}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
                      You
                    </Badge>
                  )}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className="text-sm font-bold">{entry.message_count}</span>
                <span className="text-xs text-muted-foreground ml-1">SMS</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="week" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
          </TabsList>
          <TabsContent value={timeRange} className="mt-0">
            {renderLeaderboardContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
