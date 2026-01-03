import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-slow" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in-up">
            <span className="text-sm font-medium text-primary">Built for Real Estate Professionals</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold leading-tight animate-fade-in-up animate-stagger-2">
            Stay connected with
            <br />
            <span className="text-gradient">your community</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animate-stagger-3">
            The smart way to reach homeowners near your recent sales. Send personalized SMS and email campaigns, track your success, and build relationships that win listings.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-stagger-4">
            <Button 
              size="lg" 
              className="gradient-primary text-lg px-8 h-14 shadow-glow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" 
              onClick={() => navigate('/auth')}
            >
              Start for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 h-14 border-2 hover:bg-primary/5 transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              See Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up animate-stagger-5">
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>AgentBuddy integration</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
