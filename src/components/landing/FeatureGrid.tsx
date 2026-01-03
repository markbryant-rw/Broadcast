import { Users, BarChart3, FolderOpen, Layout, Link, Trophy } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: Users,
    title: 'Smart Segmentation',
    description: 'Target the right audience with powerful filters',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track opens, clicks, and engagement',
  },
  {
    icon: FolderOpen,
    title: 'Contact Management',
    description: 'Organized database with tags and lists',
  },
  {
    icon: Layout,
    title: 'Template Library',
    description: 'Professional designs ready to send',
  },
  {
    icon: Link,
    title: 'AgentBuddy Sync',
    description: 'Two-way CRM integration',
  },
  {
    icon: Trophy,
    title: 'Team Leaderboards',
    description: 'Motivate your office with friendly competition',
  },
];

export function FeatureGrid() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that help you connect with more homeowners.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-6 rounded-xl bg-card border border-border hover-lift transition-all duration-500 ${gridVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
              style={{ transitionDelay: gridVisible ? `${index * 100}ms` : '0ms' }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
