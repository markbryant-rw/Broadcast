import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MousePointer, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardsProps {
  totalSent: number;
  totalDelivered: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  totalUnsubscribed: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const MetricCard = ({ title, value, description, icon, trend, trendValue, variant = 'default' }: MetricCardProps) => {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    danger: 'bg-destructive/5 border-destructive/20',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className={cn(variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconStyles[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && trendValue && (
            <span className={cn(
              "flex items-center text-xs font-medium",
              trend === 'up' && "text-success",
              trend === 'down' && "text-destructive",
            )}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trendValue}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MetricCards({ 
  totalSent, 
  totalDelivered, 
  openRate, 
  clickRate, 
  bounceRate,
  totalUnsubscribed 
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        title="Emails Sent"
        value={totalSent.toLocaleString()}
        description="Total emails sent"
        icon={<Mail className="h-4 w-4" />}
        variant="default"
      />
      <MetricCard
        title="Delivered"
        value={totalDelivered.toLocaleString()}
        description="Successfully delivered"
        icon={<Users className="h-4 w-4" />}
        variant="success"
      />
      <MetricCard
        title="Open Rate"
        value={`${openRate.toFixed(1)}%`}
        description="Of delivered emails"
        icon={<MousePointer className="h-4 w-4" />}
        trend={openRate >= 20 ? 'up' : 'down'}
        trendValue={openRate >= 20 ? 'Good' : 'Below avg'}
        variant={openRate >= 20 ? 'success' : 'warning'}
      />
      <MetricCard
        title="Click Rate"
        value={`${clickRate.toFixed(1)}%`}
        description="Of opened emails"
        icon={<TrendingUp className="h-4 w-4" />}
        trend={clickRate >= 3 ? 'up' : 'down'}
        trendValue={clickRate >= 3 ? 'Good' : 'Below avg'}
        variant={clickRate >= 3 ? 'success' : 'warning'}
      />
      <MetricCard
        title="Bounce Rate"
        value={`${bounceRate.toFixed(1)}%`}
        description="Failed to deliver"
        icon={<AlertCircle className="h-4 w-4" />}
        variant={bounceRate > 5 ? 'danger' : 'default'}
      />
      <MetricCard
        title="Unsubscribes"
        value={totalUnsubscribed.toLocaleString()}
        description="Total unsubscribes"
        icon={<TrendingDown className="h-4 w-4" />}
        variant={totalUnsubscribed > 100 ? 'danger' : 'default'}
      />
    </div>
  );
}
