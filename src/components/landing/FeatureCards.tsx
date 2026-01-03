import { MessageSquare, Mail, MapPin, Filter, Zap, PenTool, BarChart3, Sparkles } from 'lucide-react';

export function FeatureCards() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Two powerful ways to connect
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reach homeowners through personalized SMS or beautiful email campaigns — all from one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* SMS Card */}
          <div className="group relative bg-card rounded-2xl border border-border p-8 hover-lift overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-primary-foreground" />
              </div>
              
              <h3 className="text-2xl font-display font-bold mb-3">SMS Outreach</h3>
              <p className="text-muted-foreground mb-6">
                Reach homeowners near your recent sales with personalized text messages that get noticed.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span>Nearby sales map</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Filter className="h-4 w-4 text-primary" />
                  </div>
                  <span>Smart location filters</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span>One-click outreach</span>
                </div>
              </div>

              {/* Mini preview */}
              <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">JD</div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Preview</div>
                    <div className="text-sm bg-card p-3 rounded-lg border border-border">
                      Hi Sarah! I just sold 42 Oak St nearby. Wondering if you've thought about your home's value lately?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="group relative bg-card rounded-2xl border border-border p-8 hover-lift overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-xl gradient-accent flex items-center justify-center mb-6">
                <Mail className="h-7 w-7 text-accent-foreground" />
              </div>
              
              <h3 className="text-2xl font-display font-bold mb-3">Email Campaigns</h3>
              <p className="text-muted-foreground mb-6">
                Beautiful, professional campaigns that land in inboxes and drive engagement.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <PenTool className="h-4 w-4 text-accent" />
                  </div>
                  <span>Drag-and-drop builder</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <span>Professional templates</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </div>
                  <span>Open & click tracking</span>
                </div>
              </div>

              {/* Mini preview */}
              <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Campaign preview</div>
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="h-16 gradient-accent opacity-80" />
                    <div className="p-3">
                      <div className="h-2 w-24 bg-foreground/20 rounded mb-2" />
                      <div className="h-2 w-full bg-muted rounded mb-1" />
                      <div className="h-2 w-3/4 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
