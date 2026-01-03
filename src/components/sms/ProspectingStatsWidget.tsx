import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProspectingStats } from '@/hooks/useProspectingStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Users, MapPin, CheckCircle, Loader2 } from 'lucide-react';

function StatCard({ 
  label, 
  value, 
  previousValue, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  previousValue?: number;
  icon: React.ElementType;
}) {
  const change = previousValue !== undefined ? value - previousValue : undefined;
  const changePercent = previousValue && previousValue > 0 
    ? Math.round(((value - previousValue) / previousValue) * 100) 
    : undefined;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      {change !== undefined && change !== 0 && (
        <Badge 
          variant="outline" 
          className={change > 0 ? 'text-success border-success/50' : 'text-destructive border-destructive/50'}
        >
          {change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {change > 0 ? '+' : ''}{change}
        </Badge>
      )}
    </div>
  );
}

export default function ProspectingStatsWidget() {
  const { data: stats, isLoading } = useProspectingStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          Prospecting Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                label="Contacts Made" 
                value={stats.thisWeek.contacted} 
                previousValue={stats.lastWeek.contacted}
                icon={Users} 
              />
              <StatCard 
                label="SMS Sent" 
                value={stats.thisWeek.smsSent} 
                previousValue={stats.lastWeek.smsSent}
                icon={MessageSquare} 
              />
              <StatCard 
                label="Suburbs Covered" 
                value={stats.thisWeek.suburbsCovered} 
                previousValue={stats.lastWeek.suburbsCovered}
                icon={MapPin} 
              />
              <StatCard 
                label="Marked Done" 
                value={stats.thisWeek.contacted + stats.thisWeek.ignored} 
                previousValue={stats.lastWeek.contacted + stats.lastWeek.ignored}
                icon={CheckCircle} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="month" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                label="Contacts Made" 
                value={stats.thisMonth.contacted} 
                previousValue={stats.lastMonth.contacted}
                icon={Users} 
              />
              <StatCard 
                label="SMS Sent" 
                value={stats.thisMonth.smsSent} 
                previousValue={stats.lastMonth.smsSent}
                icon={MessageSquare} 
              />
              <StatCard 
                label="Suburbs Covered" 
                value={stats.thisMonth.suburbsCovered} 
                previousValue={stats.lastMonth.suburbsCovered}
                icon={MapPin} 
              />
              <StatCard 
                label="Marked Done" 
                value={stats.thisMonth.contacted + stats.thisMonth.ignored} 
                previousValue={stats.lastMonth.contacted + stats.lastMonth.ignored}
                icon={CheckCircle} 
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Weekly Trend Chart */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Weekly Trend</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyTrend}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="contacted" 
                  name="Contacts" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="sms" 
                  name="SMS" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
