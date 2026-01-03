import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Radio, ArrowRight, Loader2 } from 'lucide-react';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsBar } from '@/components/landing/StatsBar';
import { FeatureCards } from '@/components/landing/FeatureCards';
import { GamificationSection } from '@/components/landing/GamificationSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonial } from '@/components/landing/Testimonial';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Radio className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Broadcast</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Log in
            </Button>
            <Button className="gradient-primary shadow-glow" onClick={() => navigate('/auth')}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Stats Bar */}
      <StatsBar />

      {/* Feature Cards */}
      <FeatureCards />

      {/* Gamification */}
      <GamificationSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonial */}
      <Testimonial />

      {/* Feature Grid */}
      <FeatureGrid />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Broadcast. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
