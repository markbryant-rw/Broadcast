import { Users, MessageSquare, Mail, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useContacts } from '@/hooks/useContacts';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { useNearbySales } from '@/hooks/useNearbySales';
import { useCampaigns } from '@/hooks/useCampaigns';

export default function QuickStats() {
  const { contacts } = useContacts();
  const { logs: smsLogs } = useSMSLogs();
  const { sales } = useNearbySales();
  const { campaigns } = useCampaigns();

  const stats = [
    {
      label: 'Contacts',
      value: contacts?.length ?? 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'SMS Sent',
      value: smsLogs?.length ?? 0,
      icon: MessageSquare,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Campaigns',
      value: campaigns?.length ?? 0,
      icon: Mail,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Nearby Sales',
      value: sales?.length ?? 0,
      icon: Home,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-display font-bold truncate">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
