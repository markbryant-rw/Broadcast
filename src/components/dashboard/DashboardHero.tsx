import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ArrowRight } from 'lucide-react';

export default function DashboardHero() {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">
          What would you like to do today?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Connect with your contacts through SMS or email campaigns
        </p>
      </div>

      {/* Hero Cards */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
        {/* SMS Card */}
        <Link
          to="/sms"
          className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <div className="relative z-10 flex flex-col h-full min-h-[180px]">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">
                Send SMS
              </h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                Notify contacts about nearby sales, market updates, or just check in
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90 text-sm font-medium mt-4 group-hover:gap-3 transition-all">
              Open SMS
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </Link>

        {/* Email Card */}
        <Link
          to="/campaigns"
          className="group relative overflow-hidden rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ background: 'var(--gradient-accent)' }}
        >
          <div className="relative z-10 flex flex-col h-full min-h-[180px]">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-accent-foreground mb-2">
                Send Email
              </h2>
              <p className="text-accent-foreground/80 text-sm sm:text-base">
                Create beautiful email campaigns to nurture your contact list
              </p>
            </div>
            <div className="flex items-center gap-2 text-accent-foreground/90 text-sm font-medium mt-4 group-hover:gap-3 transition-all">
              Open Campaigns
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </Link>
      </div>
    </div>
  );
}
