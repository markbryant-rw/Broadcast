import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHero from '@/components/dashboard/DashboardHero';
import QuickStats from '@/components/dashboard/QuickStats';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import PlatformStatsWidget from '@/components/admin/PlatformStatsWidget';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section - SMS vs Email */}
        <DashboardHero />

        {/* Quick Stats */}
        <QuickStats />

        {/* Admin Widget (only visible to platform admins) */}
        <PlatformStatsWidget />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
}
