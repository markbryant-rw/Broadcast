import { Trophy, Flame, TrendingUp, Star } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const badges = [
  { icon: '🚀', name: 'First Steps', unlocked: true },
  { icon: '💬', name: 'Power Texter', unlocked: true },
  { icon: '📧', name: 'Email Master', unlocked: true },
  { icon: '🔥', name: 'Streak Starter', unlocked: true },
  { icon: '🏆', name: 'SMS Legend', unlocked: false },
  { icon: '🦸', name: 'Inbox Hero', unlocked: false },
];

const leaderboard = [
  { rank: 1, name: 'Sarah M.', score: 147, avatar: 'SM' },
  { rank: 2, name: 'John D.', score: 132, avatar: 'JD' },
  { rank: 3, name: 'Lisa K.', score: 98, avatar: 'LK' },
];

export function GamificationSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: achievementsRef, isVisible: achievementsVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: streakRef, isVisible: streakVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: leaderboardRef, isVisible: leaderboardVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-20 lg:py-28 bg-card/50 border-y border-border">
      <div className="container mx-auto px-4">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">Gamification</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Make every day count
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your progress, celebrate wins, and stay motivated with built-in achievements and team leaderboards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Achievements */}
          <div 
            ref={achievementsRef}
            className={`bg-card rounded-2xl border border-border p-6 hover-lift transition-all duration-700 delay-100 ${achievementsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Achievements</h3>
                <p className="text-sm text-muted-foreground">Unlock badges as you grow</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-500 ${
                    badge.unlocked
                      ? 'bg-primary/10 border border-primary/20 hover:scale-110'
                      : 'bg-muted/50 grayscale opacity-50'
                  }`}
                  style={{ transitionDelay: achievementsVisible ? `${i * 100}ms` : '0ms' }}
                >
                  {badge.icon}
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <span className="text-primary font-semibold">4</span> of 12 unlocked
            </div>
          </div>

          {/* Streak */}
          <div 
            ref={streakRef}
            className={`bg-card rounded-2xl border border-border p-6 hover-lift transition-all duration-700 delay-200 ${streakVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Activity Streak</h3>
                <p className="text-sm text-muted-foreground">Stay consistent</p>
              </div>
            </div>
            
            <div className="text-center py-6">
              <div className="text-6xl font-display font-bold text-gradient">7</div>
              <div className="text-sm text-muted-foreground mt-2">day streak 🔥</div>
            </div>

            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={`h-2 w-8 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ${streakVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                  style={{ transitionDelay: streakVisible ? `${day * 100}ms` : '0ms' }}
                />
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div 
            ref={leaderboardRef}
            className={`bg-card rounded-2xl border border-border p-6 hover-lift md:col-span-2 lg:col-span-1 transition-all duration-700 delay-300 ${leaderboardVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Weekly Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Top performers</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                    user.rank === 1 ? 'bg-warning/10 border border-warning/20' : 'bg-muted/30'
                  } ${leaderboardVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: leaderboardVisible ? `${index * 150}ms` : '0ms' }}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.rank === 1 ? 'bg-warning text-warning-foreground' :
                    user.rank === 2 ? 'bg-muted-foreground/30 text-foreground' :
                    'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {user.rank}
                  </div>
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {user.avatar}
                  </div>
                  <div className="flex-1 font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.score} msgs</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
