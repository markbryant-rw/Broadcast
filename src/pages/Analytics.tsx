import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailLayout from '@/components/layout/EmailLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import MetricCards from '@/components/analytics/MetricCards';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

export default function Analytics() {
  const navigate = useNavigate();
  const { isPlatformAdmin, isLoading: isAdminLoading } = usePlatformAdmin();
  const { 
    summary, 
    isLoadingSummary, 
    campaignPerformance, 
    dailyStats,
    isLoadingDaily 
  } = useAnalytics();

  // Redirect non-platform admins to dashboard
  useEffect(() => {
    if (!isAdminLoading && !isPlatformAdmin) {
      navigate('/dashboard');
    }
  }, [isPlatformAdmin, isAdminLoading, navigate]);

  const isLoading = isLoadingSummary || isLoadingDaily || isAdminLoading;
  const hasData = summary && summary.totalSent > 0;

  if (isLoading) {
    return (
      <EmailLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </EmailLayout>
    );
  }

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <EmailLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your email marketing performance
          </p>
        </div>

        {hasData ? (
          <>
            {/* Metric Cards */}
            <MetricCards
              totalSent={summary.totalSent}
              totalDelivered={summary.totalDelivered}
              openRate={summary.openRate}
              clickRate={summary.clickRate}
              bounceRate={summary.bounceRate}
              totalUnsubscribed={summary.totalUnsubscribed}
            />

            {/* Charts */}
            <AnalyticsCharts
              dailyStats={dailyStats}
              campaignPerformance={campaignPerformance}
              summary={{
                totalSent: summary.totalSent,
                totalOpened: summary.totalOpened,
                totalClicked: summary.totalClicked,
                totalBounced: summary.totalBounced,
                totalUnsubscribed: summary.totalUnsubscribed,
              }}
            />
          </>
        ) : (
          <>
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

            {/* Preview Metric Cards */}
            <MetricCards
              totalSent={0}
              totalDelivered={0}
              openRate={0}
              clickRate={0}
              bounceRate={0}
              totalUnsubscribed={0}
            />
          </>
        )}
      </div>
    </EmailLayout>
  );
}
