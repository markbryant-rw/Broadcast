import { MessageSquare, Clock, TrendingUp, Mail, Flame, Zap, Coffee } from 'lucide-react';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ActivityWidget() {
  const { logs, isLoading } = useSMSLogs();

  // Get email campaign stats
  const { data: emailStats } = useQuery({
    queryKey: ['activity-email-stats'],
    queryFn: async () => {
      const { data: analytics, error } = await supabase
        .from('campaign_analytics')
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

  // Generate cheeky SMS message
  const getSMSMessage = () => {
    if (totalMessages === 0) {
      return { icon: Coffee, text: "Ready to make your first connection? Your contacts are waiting!" };
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

  return (
    <div 
      className="animate-fade-in opacity-0"
      style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
    >
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 space-y-5">
        <h3 className="text-sm font-medium text-muted-foreground">Your Activity</h3>
        
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
