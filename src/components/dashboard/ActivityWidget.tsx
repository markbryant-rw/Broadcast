import { MessageSquare, Clock, TrendingUp, Mail, Flame, Zap, Coffee, Award, Trophy } from 'lucide-react';
import { TABLES } from '@/lib/constants/tables';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { formatDistanceToNow, differenceInDays, startOfDay, isEqual, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

// Track which milestones we've already celebrated this session
const celebratedMilestones = new Set<string>();

const triggerConfetti = (intensity: 'small' | 'medium' | 'large' = 'medium') => {
  const configs = {
    small: { particleCount: 50, spread: 60, origin: { y: 0.7 } },
    medium: { particleCount: 100, spread: 70, origin: { y: 0.6 } },
    large: { particleCount: 150, spread: 100, scalar: 1.2, origin: { y: 0.5 } }
  };
  
  confetti({
    ...configs[intensity],
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
  });
};

export default function ActivityWidget() {
  const { logs, isLoading } = useSMSLogs();
  const [streakCelebrated, setStreakCelebrated] = useState(false);
  const hasCheckedMilestones = useRef(false);

  // Get email campaign stats
  const { data: emailStats } = useQuery({
    queryKey: ['activity-email-stats'],
    queryFn: async () => {
      const { data: analytics, error } = await supabase
        .from(TABLES.BROADCAST_CAMPAIGN_ANALYTICS)
        .select('opened_count, total_recipients');
      
      if (error || !analytics || analytics.length === 0) return null;
      
      const totalOpened = analytics.reduce((sum, a) => sum + (a.opened_count || 0), 0);
      const totalRecipients = analytics.reduce((sum, a) => sum + (a.total_recipients || 0), 0);
      
      if (totalRecipients === 0) return null;
      return {
        openRate: Math.round((totalOpened / totalRecipients) * 100),
        totalSent: totalRecipients
      };
    },
  });

  // Calculate SMS stats
  const totalMessages = logs?.length || 0;
  const now = new Date();
  
  // This week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const messagesThisWeek = logs?.filter(l => 
    l.sent_at && new Date(l.sent_at) > sevenDaysAgo
  ).length || 0;

  // This quarter (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const messagesThisQuarter = logs?.filter(l => 
    l.sent_at && new Date(l.sent_at) > threeMonthsAgo
  ).length || 0;

  const lastMessage = logs?.[0];
  const lastMessageTime = lastMessage?.sent_at 
    ? formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: true })
    : null;

  // Days since last message
  const daysSinceLastMessage = lastMessage?.sent_at 
    ? Math.floor((now.getTime() - new Date(lastMessage.sent_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate activity streak
  const calculateStreak = () => {
    if (!logs || logs.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const activeDays = new Set<string>();
    
    logs.forEach(log => {
      if (log.sent_at) {
        const dayKey = startOfDay(new Date(log.sent_at)).toISOString();
        activeDays.add(dayKey);
      }
    });
    
    let streak = 0;
    let checkDate = today;
    
    // Start from today and go backwards
    while (activeDays.has(checkDate.toISOString()) || 
           (streak === 0 && activeDays.has(subDays(checkDate, 1).toISOString()))) {
      // If today has no activity but yesterday does, start from yesterday
      if (streak === 0 && !activeDays.has(checkDate.toISOString())) {
        checkDate = subDays(checkDate, 1);
      }
      if (activeDays.has(checkDate.toISOString())) {
        streak++;
      }
      checkDate = subDays(checkDate, 1);
      
      // Safety limit
      if (streak > 365) break;
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // Check milestones and trigger confetti
  useEffect(() => {
    if (isLoading || hasCheckedMilestones.current) return;
    hasCheckedMilestones.current = true;

    const milestones = [
      { key: 'sms-100', condition: totalMessages >= 100, intensity: 'large' as const },
      { key: 'sms-50', condition: totalMessages >= 50 && totalMessages < 100, intensity: 'medium' as const },
      { key: 'sms-25', condition: totalMessages >= 25 && totalMessages < 50, intensity: 'small' as const },
      { key: 'email-50', condition: (emailStats?.openRate || 0) >= 50, intensity: 'large' as const },
      { key: 'email-40', condition: (emailStats?.openRate || 0) >= 40 && (emailStats?.openRate || 0) < 50, intensity: 'medium' as const },
      { key: 'streak-30', condition: streak >= 30, intensity: 'large' as const },
      { key: 'streak-14', condition: streak >= 14 && streak < 30, intensity: 'medium' as const },
      { key: 'streak-7', condition: streak >= 7 && streak < 14, intensity: 'small' as const },
    ];

    // Find the highest priority milestone to celebrate
    const toastMilestone = milestones.find(m => m.condition && !celebratedMilestones.has(m.key));
    
    if (toastMilestone) {
      celebratedMilestones.add(toastMilestone.key);
      setTimeout(() => {
        triggerConfetti(toastMilestone.intensity);
      }, 500);
    }
  }, [isLoading, totalMessages, emailStats?.openRate, streak]);

  // Get streak message
  const getStreakMessage = () => {
    if (streak === 0) return null;
    if (streak >= 30) return { text: `🔥 ${streak} day streak! You're unstoppable!`, variant: 'legendary' };
    if (streak >= 14) return { text: `⚡ ${streak} day streak! Two weeks of wins!`, variant: 'epic' };
    if (streak >= 7) return { text: `🎯 ${streak} day streak! One week strong!`, variant: 'great' };
    if (streak >= 3) return { text: `✨ ${streak} day streak! Keep it going!`, variant: 'good' };
    return { text: `${streak} day${streak === 1 ? '' : 's'} active`, variant: 'normal' };
  };

  // Generate cheeky SMS message
  const getSMSMessage = () => {
    if (totalMessages === 0) {
      return { icon: Coffee, text: "Ready to make your first connection? Your contacts are waiting!" };
    }
    if (totalMessages >= 100) {
      return { icon: Trophy, text: `🏆 100+ messages sent! You're a prospecting pro!` };
    }
    if (messagesThisWeek >= 20) {
      return { icon: Flame, text: `You're on fire! ${messagesThisWeek} messages this week - your contacts love hearing from you.` };
    }
    if (messagesThisWeek >= 10) {
      return { icon: Zap, text: `Nice momentum! ${messagesThisWeek} messages this week. Keep that energy going!` };
    }
    if (messagesThisWeek >= 1) {
      return { icon: TrendingUp, text: `Good start this week! A few more messages could unlock some big wins.` };
    }
    if (daysSinceLastMessage !== null && daysSinceLastMessage > 7) {
      return { icon: Coffee, text: `It's been ${daysSinceLastMessage} days... your contacts might be wondering where you went!` };
    }
    if (daysSinceLastMessage !== null && daysSinceLastMessage > 3) {
      return { icon: Coffee, text: "Time to reach out? Your hot opportunities are waiting for you." };
    }
    return { icon: MessageSquare, text: "Your contacts are ready to hear from you. Who's next?" };
  };

  // Generate cheeky email message
  const getEmailMessage = () => {
    if (!emailStats) {
      return { icon: Mail, text: "Your first email campaign is waiting to be written!" };
    }
    if (emailStats.openRate >= 50) {
      return { icon: Trophy, text: `🎉 ${emailStats.openRate}% open rate! You're in the top tier!` };
    }
    if (emailStats.openRate >= 40) {
      return { icon: Flame, text: `${emailStats.openRate}% open rate? You're basically an email wizard. Keep it up!` };
    }
    if (emailStats.openRate >= 25) {
      return { icon: Zap, text: `Solid ${emailStats.openRate}% open rate! Your subject lines are working.` };
    }
    if (emailStats.openRate >= 15) {
      return { icon: TrendingUp, text: `${emailStats.openRate}% open rate - not bad! Try adding emojis to subject lines for a boost.` };
    }
    return { icon: Mail, text: `Opens are a bit low. Try shorter, punchier subject lines - questions work great!` };
  };

  const smsMessage = getSMSMessage();
  const emailMessage = getEmailMessage();
  const streakInfo = getStreakMessage();
  const SMSIcon = smsMessage.icon;
  const EmailIcon = emailMessage.icon;

  if (isLoading) {
    return (
      <div 
        className="animate-fade-in opacity-0"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <div className="rounded-xl border border-border bg-card/50 p-5 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4" />
          <div className="h-3 bg-muted rounded w-2/3 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  const streakVariants = {
    legendary: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500',
    epic: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-500',
    great: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-500',
    good: 'bg-primary/10 border-primary/30 text-primary',
    normal: 'bg-muted border-border text-muted-foreground'
  };

  return (
    <div 
      className="animate-fade-in opacity-0"
      style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
    >
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Your Activity</h3>
          
          {/* Streak Badge */}
          {streakInfo && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${streakVariants[streakInfo.variant as keyof typeof streakVariants]}`}>
              <Award className="h-3.5 w-3.5" />
              <span>{streakInfo.text}</span>
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Total Messages */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalMessages}</p>
              <p className="text-xs text-muted-foreground">total sent</p>
            </div>
          </div>

          {/* This Week */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{messagesThisWeek}</p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </div>

          {/* Last Message */}
          {lastMessageTime && (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Last sent</p>
                <p className="text-xs text-muted-foreground">{lastMessageTime}</p>
              </div>
            </div>
          )}
        </div>

        {/* Motivational Messages */}
        <div className="space-y-3 pt-2 border-t border-border">
          {/* SMS Message */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <SMSIcon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {smsMessage.text}
            </p>
          </div>

          {/* Email Message */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <EmailIcon className="h-4 w-4 text-accent-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {emailMessage.text}
            </p>
          </div>

          {/* Quarterly callout if they've been active */}
          {messagesThisQuarter >= 50 && (
            <div className="flex items-start gap-3 pt-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{messagesThisQuarter} SMS this quarter</span> — you're officially a power user! 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
