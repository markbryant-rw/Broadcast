import HomeLayout from '@/components/layout/HomeLayout';
import DashboardHero from '@/components/dashboard/DashboardHero';
import ActivityWidget from '@/components/dashboard/ActivityWidget';
import WhatsNewWidget from '@/components/dashboard/WhatsNewWidget';
import TrophyCase from '@/components/dashboard/TrophyCase';
import WeeklyLeaderboard from '@/components/dashboard/WeeklyLeaderboard';
import PlatformStatsWidget from '@/components/admin/PlatformStatsWidget';

export default function Dashboard() {
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section - SMS vs Email choice */}
        <DashboardHero />

        {/* Personal Activity & Tips */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <ActivityWidget />
          <WhatsNewWidget />
        </div>

        {/* Trophy Case */}
        <div className="max-w-4xl mx-auto">
          <TrophyCase />
        </div>

        {/* Weekly Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <WeeklyLeaderboard />
        </div>

        {/* Admin Widget (only visible to platform admins) */}
        <PlatformStatsWidget />
      </div>
    </HomeLayout>
  );
}
