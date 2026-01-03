import { MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityWidget() {
  const { logs, isLoading } = useSMSLogs();

  // Calculate stats
  const totalMessages = logs?.length || 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const messagesThisWeek = logs?.filter(l => 
    l.sent_at && new Date(l.sent_at) > sevenDaysAgo
  ).length || 0;

  const lastMessage = logs?.[0];
  const lastMessageTime = lastMessage?.sent_at 
    ? formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: true })
    : null;

  if (isLoading) {
    return (
      <div 
        className="animate-fade-in opacity-0"
        style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
      >
        <div className="rounded-xl border border-border bg-card/50 p-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-3" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Don't show if no activity yet
  if (totalMessages === 0) {
    return null;
  }

  return (
    <div 
      className="animate-fade-in opacity-0"
      style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
    >
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Activity</h3>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Total Messages */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{totalMessages}</p>
              <p className="text-xs text-muted-foreground">messages sent</p>
            </div>
          </div>

          {/* This Week */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">{messagesThisWeek}</p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </div>

          {/* Last Message */}
          {lastMessageTime && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Last message</p>
                <p className="text-xs text-muted-foreground">{lastMessageTime}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
