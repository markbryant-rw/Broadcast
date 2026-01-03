import { Lightbulb, Sparkles, Zap, Target } from 'lucide-react';

// Tips rotate based on day of week for variety
const tips = [
  {
    icon: Target,
    title: "Hot tip",
    text: "Contacts near recent sales are 3x more likely to respond to your outreach"
  },
  {
    icon: Zap,
    title: "Did you know?",
    text: "You can bulk-send SMS to up to 50 contacts at once from the SMS page"
  },
  {
    icon: Sparkles,
    title: "Pro tip",
    text: "Personal touches in messages boost reply rates by 40%. Mention the nearby sale!"
  },
  {
    icon: Lightbulb,
    title: "Quick win",
    text: "Subject lines with questions get 10% higher open rates. Try asking something!"
  },
  {
    icon: Target,
    title: "Best practice",
    text: "Follow up within 48 hours of a nearby sale for the best response rates"
  },
  {
    icon: Zap,
    title: "Time saver",
    text: "Save your best messages as templates to reuse them in seconds"
  },
  {
    icon: Sparkles,
    title: "Pro tip",
    text: "Emojis in email subject lines can boost open rates by 15%. Don't overdo it though! 😉"
  }
];

export default function WhatsNewWidget() {
  // Pick 2 tips based on day of week for consistent daily experience
  const dayOfWeek = new Date().getDay();
  const tipIndex1 = dayOfWeek % tips.length;
  const tipIndex2 = (dayOfWeek + 3) % tips.length;
  
  const selectedTips = [tips[tipIndex1], tips[tipIndex2]];

  return (
    <div 
      className="animate-fade-in opacity-0"
      style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
    >
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Tips & Updates
        </h3>
        
        <div className="space-y-4">
          {selectedTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">{tip.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
