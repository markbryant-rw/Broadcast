import { useAchievements } from '@/hooks/useAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const rarityStyles: Record<string, string> = {
  common: 'border-muted-foreground/30 bg-muted/30',
  uncommon: 'border-green-500/50 bg-green-500/10',
  rare: 'border-blue-500/50 bg-blue-500/10',
  epic: 'border-purple-500/50 bg-purple-500/10 shadow-purple-500/20 shadow-md',
  legendary: 'border-amber-500/50 bg-amber-500/10 shadow-amber-500/30 shadow-lg',
};

const rarityBadgeStyles: Record<string, string> = {
  common: 'bg-muted text-muted-foreground',
  uncommon: 'bg-green-500/20 text-green-600',
  rare: 'bg-blue-500/20 text-blue-600',
  epic: 'bg-purple-500/20 text-purple-600',
  legendary: 'bg-amber-500/20 text-amber-600',
};

export default function TrophyCase() {
  const { achievements, userAchievements, unlockedAchievementIds, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Trophy Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  // Get unlock dates for recently unlocked display
  const unlockDates = new Map(
    userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at])
  );

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Trophy Case
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {achievements.map((achievement, index) => {
            const isUnlocked = unlockedAchievementIds.has(achievement.id);
            const unlockDate = unlockDates.get(achievement.id);

            return (
              <div
                key={achievement.id}
                className={cn(
                  'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-300',
                  isUnlocked
                    ? rarityStyles[achievement.rarity]
                    : 'border-border/50 bg-muted/20 opacity-50 grayscale',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                title={isUnlocked 
                  ? `${achievement.name}: ${achievement.description}` 
                  : `Locked: ${achievement.description}`
                }
              >
                <span className="text-2xl mb-1">
                  {isUnlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
                </span>
                <span className={cn(
                  'text-xs font-medium text-center leading-tight',
                  isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {achievement.name}
                </span>
                {isUnlocked && unlockDate && (
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(unlockDate), { addSuffix: true })}
                  </span>
                )}
                {!isUnlocked && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-[9px] mt-1 px-1 py-0', rarityBadgeStyles[achievement.rarity])}
                  >
                    {achievement.rarity}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
