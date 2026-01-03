import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function FinalCTA() {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section ref={ref} className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className={`absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start free today</span>
          </div>

          <h2 className={`text-3xl md:text-5xl font-display font-bold mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Ready to win your
            <br />
            <span className="text-gradient">next listing?</span>
          </h2>

          <p className={`text-lg text-muted-foreground mb-10 max-w-xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Join thousands of real estate professionals using Broadcast to stay connected with their community.
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              size="lg" 
              className="gradient-primary text-lg px-10 h-14 shadow-glow animate-pulse-glow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" 
              onClick={() => navigate('/auth')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-lg px-8 h-14"
              onClick={() => navigate('/auth')}
            >
              Log in →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
