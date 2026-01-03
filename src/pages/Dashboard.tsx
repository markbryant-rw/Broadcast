import HomeLayout from '@/components/layout/HomeLayout';
import DashboardHero from '@/components/dashboard/DashboardHero';
import PlatformStatsWidget from '@/components/admin/PlatformStatsWidget';

export default function Dashboard() {
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section - SMS vs Email choice */}
        <DashboardHero />

        {/* Admin Widget (only visible to platform admins) */}
        <PlatformStatsWidget />
      </div>
    </HomeLayout>
  );
}
