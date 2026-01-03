import { useEffect, useState, useRef } from 'react';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
}

function StatItem({ value, suffix, label }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-display font-bold text-foreground">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="py-12 border-y border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value={2000} suffix="+" label="Real estate agents" />
          <StatItem value={1} suffix="M+" label="Messages sent" />
          <StatItem value={45} suffix="%" label="Avg open rate" />
          <StatItem value={500} suffix="+" label="Listings won" />
        </div>
      </div>
    </section>
  );
}
