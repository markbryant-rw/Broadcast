import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Radio, ArrowRight, Mail, Users, BarChart3, Loader2 } from 'lucide-react';

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
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Broadcast</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Log in
            </Button>
            <Button className="gradient-primary" onClick={() => navigate('/auth')}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
            Email marketing
            <br />
            <span className="text-gradient">made simple.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Create beautiful campaigns, manage your contacts, and track performance — 
            all synced with AgentBuddy for seamless customer engagement.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary text-lg px-8" onClick={() => navigate('/auth')}>
              Start for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              See Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Beautiful Campaigns</h3>
              <p className="text-muted-foreground">
                Drag-and-drop email builder with templates designed to convert.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-14 w-14 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Smart Segmentation</h3>
              <p className="text-muted-foreground">
                Target the right audience with powerful contact management.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-14 w-14 rounded-xl bg-success flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-7 w-7 text-success-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Track opens, clicks, and engagement with detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to grow your audience?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of businesses using Broadcast to connect with their customers.
          </p>
          <Button size="lg" className="gradient-primary text-lg px-8" onClick={() => navigate('/auth')}>
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Broadcast. All rights reserved.
        </div>
      </footer>
    </div>
  );
}