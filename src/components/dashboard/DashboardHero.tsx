import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ArrowRight, Flame, Home, Send, BarChart3 } from 'lucide-react';
import { useHotOpportunities } from '@/hooks/useHotOpportunities';
import { useNearbySales } from '@/hooks/useNearbySales';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardHero() {
  const { user } = useAuth();
  
  // SMS Stats
  const { data: opportunities } = useHotOpportunities(100);
  const { sales } = useNearbySales();
  
  // Email Stats
  const { campaigns } = useCampaigns();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.user_metadata?.first_name || null;

  // Calculate new sales this week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newSalesThisWeek = sales?.filter(s => 
    s.created_at && new Date(s.created_at) > sevenDaysAgo
  ).length || 0;

  // Calculate average open rate from campaign analytics
  const { data: avgOpenRate } = useQuery({
    queryKey: ['campaign-avg-open-rate'],
    queryFn: async () => {
      const { data: analytics, error } = await supabase
        .from('campaign_analytics')
        .select('opened_count, total_recipients');
      
      if (error || !analytics || analytics.length === 0) return null;
      
      const totalOpened = analytics.reduce((sum, a) => sum + (a.opened_count || 0), 0);
      const totalRecipients = analytics.reduce((sum, a) => sum + (a.total_recipients || 0), 0);
      
      if (totalRecipients === 0) return null;
      return Math.round((totalOpened / totalRecipients) * 100);
    },
  });

  const hotOppsCount = opportunities?.length || 0;
  const campaignCount = campaigns?.length || 0;
  const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;

  return (
    <div className="space-y-8">
      {/* Hero Header with Personalized Greeting */}
      <div 
        className="text-center space-y-2 pt-4 animate-fade-in opacity-0"
        style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
      >
        <p className="text-muted-foreground text-lg">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}! 👋
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
          What would you like to do?
        </h1>
      </div>

      {/* Hero Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* SMS Card */}
        <Link
          to="/sms"
          className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in opacity-0"
          style={{ background: 'var(--gradient-primary)', animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className="relative z-10 flex flex-col h-full min-h-[220px]">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">
                SMS Prospecting
              </h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                Reach out to contacts near recent sales
              </p>
            </div>

            {/* Mini Stats */}
            <div className="flex flex-wrap gap-2 mt-4 mb-3">
              {hotOppsCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Flame className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-medium text-primary-foreground">
                    {hotOppsCount} hot {hotOppsCount === 1 ? 'opportunity' : 'opportunities'}
                  </span>
                </div>
              )}
              {newSalesThisWeek > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Home className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-medium text-primary-foreground">
                    {newSalesThisWeek} new {newSalesThisWeek === 1 ? 'sale' : 'sales'} this week
                  </span>
                </div>
              )}
              {hotOppsCount === 0 && newSalesThisWeek === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-sm text-primary-foreground/80">
                    Upload sales to find opportunities
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-primary-foreground text-sm font-medium group-hover:gap-3 transition-all">
              Open SMS
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </Link>

        {/* Email Card */}
        <Link
          to="/campaigns"
          className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in opacity-0"
          style={{ background: 'var(--gradient-accent)', animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className="relative z-10 flex flex-col h-full min-h-[220px]">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-accent-foreground mb-2">
                Email Campaigns
              </h2>
              <p className="text-accent-foreground/80 text-sm sm:text-base">
                Create and send beautiful email campaigns
              </p>
            </div>

            {/* Mini Stats */}
            <div className="flex flex-wrap gap-2 mt-4 mb-3">
              {campaignCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Send className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm font-medium text-accent-foreground">
                    {sentCampaigns} sent, {campaignCount - sentCampaigns} draft{campaignCount - sentCampaigns !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {avgOpenRate !== null && avgOpenRate > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <BarChart3 className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm font-medium text-accent-foreground">
                    {avgOpenRate}% avg open rate
                  </span>
                </div>
              )}
              {campaignCount === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-sm text-accent-foreground/80">
                    Create your first campaign
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-accent-foreground text-sm font-medium group-hover:gap-3 transition-all">
              Open Campaigns
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </Link>
      </div>
    </div>
  );
}
