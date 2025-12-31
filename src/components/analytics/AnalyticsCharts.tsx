import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';

interface DailyStats {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  sent_at: string | null;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
}

interface AnalyticsChartsProps {
  dailyStats: DailyStats[];
  campaignPerformance: CampaignPerformance[];
  summary: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function AnalyticsCharts({ dailyStats, campaignPerformance, summary }: AnalyticsChartsProps) {
  const pieData = [
    { name: 'Opened', value: summary.totalOpened, color: 'hsl(var(--primary))' },
    { name: 'Clicked', value: summary.totalClicked, color: 'hsl(var(--accent))' },
    { name: 'Bounced', value: summary.totalBounced, color: 'hsl(var(--destructive))' },
    { name: 'Unsubscribed', value: summary.totalUnsubscribed, color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0);

  const formattedDailyStats = dailyStats.map(stat => ({
    ...stat,
    displayDate: format(new Date(stat.date), 'MMM d'),
  }));

  const formattedCampaignPerformance = campaignPerformance.slice(0, 5).map(campaign => ({
    ...campaign,
    displayName: campaign.name.length > 20 ? campaign.name.slice(0, 20) + '...' : campaign.name,
  }));

  return (
    <div className="grid gap-6">
      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Email Activity (Last 30 Days)</CardTitle>
          <CardDescription>Track your email engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedDailyStats}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorSent)"
                  strokeWidth={2}
                  name="Sent"
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stroke="hsl(var(--accent))"
                  fillOpacity={1}
                  fill="url(#colorOpened)"
                  strokeWidth={2}
                  name="Opened"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Campaign Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Top Campaigns</CardTitle>
            <CardDescription>Performance of your recent campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {formattedCampaignPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedCampaignPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="displayName" 
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="opened_count" fill="hsl(var(--primary))" name="Opened" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="clicked_count" fill="hsl(var(--accent))" name="Clicked" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No campaign data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Engagement Breakdown</CardTitle>
            <CardDescription>How subscribers interact with your emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No engagement data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
