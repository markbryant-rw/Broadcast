import { Upload, Send, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your sales',
    description: 'Import recent sales data to discover nearby opportunities in your farm area.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Reach out personally',
    description: 'Send personalized SMS or email to homeowners who might be interested.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track & celebrate',
    description: 'Watch your success grow with analytics, achievements, and team leaderboards.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with a simple three-step process.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              
              <div className="relative">
                {/* Step number */}
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center z-10">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="h-24 w-24 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center mb-6 hover-lift">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
