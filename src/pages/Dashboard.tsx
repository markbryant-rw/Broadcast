import HomeLayout from '@/components/layout/HomeLayout';
import DashboardHero from '@/components/dashboard/DashboardHero';
import ActivityWidget from '@/components/dashboard/ActivityWidget';
import PlatformStatsWidget from '@/components/admin/PlatformStatsWidget';

export default function Dashboard() {
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section - SMS vs Email choice */}
        <DashboardHero />

        {/* Personal Activity Widget */}
        <div className="max-w-4xl mx-auto">
          <ActivityWidget />
        </div>

        {/* Admin Widget (only visible to platform admins) */}
        <PlatformStatsWidget />
      </div>
    </HomeLayout>
  );
}
