import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Mail, Home, Users, Clock } from 'lucide-react';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useNearbySales } from '@/hooks/useNearbySales';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'sms' | 'campaign' | 'sale' | 'contact';
  title: string;
  description: string;
  timestamp: Date;
  icon: typeof MessageSquare;
  iconColor: string;
  iconBg: string;
}

export default function ActivityFeed() {
  const { logs: smsLogs } = useSMSLogs();
  const { campaigns } = useCampaigns();
  const { sales } = useNearbySales();

  // Build activity items from all sources
  const activities: ActivityItem[] = [
    // SMS activities
    ...(smsLogs?.slice(0, 3).map(log => ({
      id: `sms-${log.id}`,
      type: 'sms' as const,
      title: 'SMS Sent',
      description: `To ${log.phone_number}`,
      timestamp: new Date(log.sent_at),
      icon: MessageSquare,
      iconColor: 'text-success',
      iconBg: 'bg-success/10',
    })) || []),

    // Campaign activities
    ...(campaigns?.slice(0, 3).map(campaign => ({
      id: `campaign-${campaign.id}`,
      type: 'campaign' as const,
      title: campaign.status === 'sent' ? 'Campaign Sent' : 'Campaign Created',
      description: campaign.name,
      timestamp: new Date(campaign.sent_at || campaign.created_at),
      icon: Mail,
      iconColor: 'text-accent',
      iconBg: 'bg-accent/10',
    })) || []),

    // Nearby sales
    ...(sales?.slice(0, 3).map(sale => ({
      id: `sale-${sale.id}`,
      type: 'sale' as const,
      title: 'Sale Recorded',
      description: `${sale.address} - ${sale.suburb}`,
      timestamp: new Date(sale.created_at),
      icon: Home,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
    })) || []),
  ];

  // Sort by timestamp and take most recent
  const sortedActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  if (sortedActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Start by sending an SMS or creating a campaign
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Recent Activity</CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`h-9 w-9 rounded-lg ${activity.iconBg} flex items-center justify-center shrink-0`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
