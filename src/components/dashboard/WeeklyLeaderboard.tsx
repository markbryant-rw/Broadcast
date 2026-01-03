import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  message_count: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

const rankStyles = [
  { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10' },
];

export default function WeeklyLeaderboard() {
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
    queryKey: ['weekly-leaderboard', userOrg],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // Get SMS counts grouped by user
      let query = supabase
        .from('sms_logs')
        .select('user_id')
        .gte('sent_at', weekStart)
        .lte('sent_at', weekEnd);

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

  if (isLoading) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Weekly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Weekly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity this week yet.</p>
            <p className="text-xs mt-1">Be the first to send a message!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Weekly Leaderboard
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            This Week
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
