import { Quote } from 'lucide-react';

export function Testimonial() {
  return (
    <section className="py-20 lg:py-28 bg-card/50 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-8">
            <Quote className="h-6 w-6 text-primary-foreground" />
          </div>
          
          <blockquote className="text-2xl md:text-3xl font-display font-medium leading-relaxed mb-8">
            "Broadcast helped me stay top-of-mind in my farm area. I've won{' '}
            <span className="text-gradient">3 new listings</span> just by being the agent who reached out first."
          </blockquote>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
              MR
            </div>
            <div className="text-left">
              <div className="font-display font-semibold">Michelle Rodriguez</div>
              <div className="text-sm text-muted-foreground">Top Producer, Coastal Realty</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
