import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProspectingStats } from '@/hooks/useProspectingStats';
import { useUserSettings } from '@/hooks/useUserSettings';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Users, MapPin, CheckCircle, Loader2, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

function StatCard({ 
  label, 
  value, 
  previousValue, 
  icon: Icon,
  goal,
}: { 
  label: string; 
  value: number; 
  previousValue?: number;
  icon: React.ElementType;
  goal?: number;
}) {
  const change = previousValue !== undefined ? value - previousValue : undefined;
  const goalReached = goal !== undefined && value >= goal;
  const goalProgress = goal !== undefined ? Math.min(100, Math.round((value / goal) * 100)) : undefined;

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-lg",
      goalReached ? "bg-success/10 ring-1 ring-success/30" : "bg-muted/50"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          goalReached ? "bg-success/20" : "bg-primary/10"
        )}>
          <Icon className={cn("h-4 w-4", goalReached ? "text-success" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {goalReached && <Trophy className="h-4 w-4 text-warning animate-bounce" />}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
        {change !== undefined && change !== 0 && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              change > 0 ? 'text-success border-success/50' : 'text-destructive border-destructive/50'
            )}
          >
            {change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {change > 0 ? '+' : ''}{change}
          </Badge>
        )}
      </div>
      {goal !== undefined && (
        <div className="space-y-1">
          <Progress 
            value={goalProgress} 
            className={cn("h-1.5", goalReached && "[&>div]:bg-success")}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{goalReached ? "Goal reached! 🎉" : `${goalProgress}% of goal`}</span>
            <span>Goal: {goal}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProspectingStatsWidget() {
  const { data: stats, isLoading } = useProspectingStats();
  const { data: userSettings } = useUserSettings();
  const celebratedRef = useRef<{ contacts: boolean; sms: boolean }>({ contacts: false, sms: false });
  
  const contactGoal = userSettings?.weeklyContactGoal ?? 50;
  const smsGoal = userSettings?.weeklySmSGoal ?? 100;

  // Check for goal achievements and celebrate
  useEffect(() => {
    if (!stats) return;

    const contactsReached = stats.thisWeek.contacted >= contactGoal;
    const smsReached = stats.thisWeek.smsSent >= smsGoal;

    if (contactsReached && !celebratedRef.current.contacts) {
      celebratedRef.current.contacts = true;
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6'],
      });
    }

    if (smsReached && !celebratedRef.current.sms) {
      celebratedRef.current.sms = true;
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6'],
      });
    }
  }, [stats, contactGoal, smsGoal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const contactGoalReached = stats.thisWeek.contacted >= contactGoal;
  const smsGoalReached = stats.thisWeek.smsSent >= smsGoal;

  return (
    <div className="space-y-4">
      {/* Achievement Banner */}
      {(contactGoalReached || smsGoalReached) && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-success/20 to-warning/20 border border-success/30 flex items-center gap-3">
          <div className="p-2 rounded-full bg-success/20">
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              Weekly Goal{contactGoalReached && smsGoalReached ? 's' : ''} Reached!
              <Sparkles className="h-4 w-4 text-warning animate-pulse" />
            </div>
            <div className="text-sm text-muted-foreground">
              {contactGoalReached && smsGoalReached 
                ? `You hit both ${contactGoal} contacts and ${smsGoal} SMS!`
                : contactGoalReached 
                  ? `You contacted ${contactGoal}+ people this week!`
                  : `You sent ${smsGoal}+ SMS this week!`
              }
            </div>
          </div>
        </div>
      )}

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
              goal={contactGoal}
            />
            <StatCard 
              label="SMS Sent" 
              value={stats.thisWeek.smsSent} 
              previousValue={stats.lastWeek.smsSent}
              icon={MessageSquare}
              goal={smsGoal}
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
    </div>
  );
}
