import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, MousePointer, Mail } from 'lucide-react';

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your email marketing performance
          </p>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold">No data yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Send your first campaign to start seeing analytics and engagement metrics.
            </p>
          </CardContent>
        </Card>

        {/* Metric Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="opacity-60">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails Sent
              </CardDescription>
              <CardTitle className="text-3xl font-display">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Open Rate
              </CardDescription>
              <CardTitle className="text-3xl font-display">0%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Click Rate
              </CardDescription>
              <CardTitle className="text-3xl font-display">0%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}