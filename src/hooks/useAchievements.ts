import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TABLES } from '@/lib/constants/tables';
import { supabase } from '@/integrations/supabase/client';
import { useSMSLogs } from './useSMSLogs';
import { useContacts } from './useContacts';
import { differenceInDays, startOfDay, parseISO } from 'date-fns';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
  rarity: string;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  label: string;
}

export function useAchievements() {
  const queryClient = useQueryClient();
  const { logs } = useSMSLogs();
  const { contacts } = useContacts();
  const checkedRef = useRef(false);

  // Fetch all achievement definitions
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('criteria_value', { ascending: true });
      
      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Fetch user's unlocked achievements
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
  });

  // Fetch campaign stats for email achievements
  const { data: campaignStats } = useQuery({
    queryKey: ['campaign-stats-for-achievements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0, avgOpenRate: 0 };

      const { data: campaigns } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGNS)
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'sent');

      const { data: analytics } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGN_ANALYTICS)
        .select('opened_count, sent_count');

      const totalSent = analytics?.reduce((sum, a) => sum + (a.sent_count || 0), 0) || 0;
      const totalOpened = analytics?.reduce((sum, a) => sum + (a.opened_count || 0), 0) || 0;
      const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

      return {
        count: campaigns?.length || 0,
        avgOpenRate,
      };
    },
  });

  // Mutation to unlock an achievement
  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select('*, achievement:achievements(*)')
        .single();

      if (error) {
        if (error.code === '23505') return null; // Already unlocked
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.achievement) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        
        // Trigger confetti
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1'],
        });

        toast.success(`🎉 Achievement Unlocked: ${data.achievement.name}!`, {
          description: data.achievement.description,
        });
      }
    },
  });

  // Calculate streak from logs
  const calculateStreak = (): number => {
    if (!logs || logs.length === 0) return 0;
    
    const uniqueDays = new Set(
      logs.map(log => startOfDay(parseISO(log.sent_at)).toISOString())
    );
    const sortedDays = Array.from(uniqueDays).sort().reverse();
    
    if (sortedDays.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const mostRecent = new Date(sortedDays[0]);
    
    if (differenceInDays(today, mostRecent) > 1) return 0;
    
    let streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const current = new Date(sortedDays[i]);
      const previous = new Date(sortedDays[i - 1]);
      if (differenceInDays(previous, current) === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Get progress for an achievement
  const getAchievementProgress = (achievement: Achievement): AchievementProgress => {
    const streak = calculateStreak();
    let current = 0;
    let label = '';

    switch (achievement.criteria_type) {
      case 'sms_count':
        current = logs?.length || 0;
        label = `${current}/${achievement.criteria_value} SMS`;
        break;
      case 'contacts_count':
        current = contacts?.length || 0;
        label = `${current}/${achievement.criteria_value} contacts`;
        break;
      case 'campaign_count':
        current = campaignStats?.count || 0;
        label = `${current}/${achievement.criteria_value} campaigns`;
        break;
      case 'email_open_rate':
        current = Math.round(campaignStats?.avgOpenRate || 0);
        label = `${current}%/${achievement.criteria_value}% open rate`;
        break;
      case 'streak_days':
        current = streak;
        label = `${current}/${achievement.criteria_value} day streak`;
        break;
      case 'time_based':
        // Time-based achievements are binary
        if (logs && logs.length > 0) {
          const hours = logs.map(log => new Date(log.sent_at).getHours());
          if (achievement.key === 'early_bird') {
            current = hours.some(h => h < 8) ? 1 : 0;
            label = current ? 'Unlocked!' : 'Send before 8am';
          } else if (achievement.key === 'night_owl') {
            current = hours.some(h => h >= 22) ? 1 : 0;
            label = current ? 'Unlocked!' : 'Send after 10pm';
          }
        } else {
          label = achievement.key === 'early_bird' ? 'Send before 8am' : 'Send after 10pm';
        }
        break;
      default:
        label = 'Progress unknown';
    }

    const target = achievement.criteria_type === 'time_based' ? 1 : achievement.criteria_value;
    const percentage = Math.min(100, (current / target) * 100);

    return { current, target, percentage, label };
  };

  // Check and award achievements
  useEffect(() => {
    if (checkedRef.current || achievementsLoading || userAchievementsLoading) return;
    if (!logs || !contacts || !achievements.length) return;

    checkedRef.current = true;
    const unlockedKeys = new Set(userAchievements.map(ua => ua.achievement?.key));
    const streak = calculateStreak();

    achievements.forEach(achievement => {
      if (unlockedKeys.has(achievement.key)) return;

      let shouldUnlock = false;

      switch (achievement.criteria_type) {
        case 'sms_count':
          shouldUnlock = logs.length >= achievement.criteria_value;
          break;
        case 'contacts_count':
          shouldUnlock = contacts.length >= achievement.criteria_value;
          break;
        case 'campaign_count':
          shouldUnlock = (campaignStats?.count || 0) >= achievement.criteria_value;
          break;
        case 'email_open_rate':
          shouldUnlock = (campaignStats?.avgOpenRate || 0) >= achievement.criteria_value;
          break;
        case 'streak_days':
          shouldUnlock = streak >= achievement.criteria_value;
          break;
        case 'time_based':
          if (logs.length > 0) {
            const hours = logs.map(log => new Date(log.sent_at).getHours());
            if (achievement.key === 'early_bird') {
              shouldUnlock = hours.some(h => h < 8);
            } else if (achievement.key === 'night_owl') {
              shouldUnlock = hours.some(h => h >= 22);
            }
          }
          break;
      }

      if (shouldUnlock) {
        unlockAchievement.mutate(achievement.id);
      }
    });
  }, [logs, contacts, achievements, userAchievements, campaignStats, achievementsLoading, userAchievementsLoading]);

  const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

  return {
    achievements,
    userAchievements,
    unlockedAchievementIds,
    isLoading: achievementsLoading || userAchievementsLoading,
    streak: calculateStreak(),
    getAchievementProgress,
  };
}
