import { useState, useMemo } from 'react';
import { Search, Plus, Check, MapPin, TrendingUp, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvailableSuburbs, useAddFavoriteSuburb } from '@/hooks/useSuburbFavorites';
import { cn } from '@/lib/utils';

interface SuburbPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
}

export default function SuburbPicker({ open, onOpenChange, currentCount }: SuburbPickerProps) {
  const [search, setSearch] = useState('');
  const { data: suburbs = [], isLoading } = useAvailableSuburbs(search);
  const addFavorite = useAddFavoriteSuburb();

  const remainingSlots = 5 - currentCount;

  // Get top 6 suburbs by sale count (not already favorited)
  const recommendedSuburbs = useMemo(() => {
    return suburbs
      .filter(s => !s.isFavorite)
      .slice(0, 6);
  }, [suburbs]);

  // Group suburbs by city
  const groupedSuburbs = useMemo(() => {
    const groups = new Map<string, typeof suburbs>();
    suburbs.forEach(suburb => {
      const city = suburb.city || 'Other';
      if (!groups.has(city)) {
        groups.set(city, []);
      }
      groups.get(city)!.push(suburb);
    });
    return groups;
  }, [suburbs]);

  const handleAdd = async (suburb: string, city: string | null) => {
    await addFavorite.mutateAsync({ suburb, city });
    if (currentCount + 1 >= 5) {
      onOpenChange(false);
    }
  };

  const getHeatColor = (saleCount: number): string => {
    if (saleCount >= 50) return 'from-primary/20 to-primary/5 border-primary/30';
    if (saleCount >= 30) return 'from-success/20 to-success/5 border-success/30';
    if (saleCount >= 15) return 'from-warning/20 to-warning/5 border-warning/30';
    return 'from-muted/20 to-muted/5 border-border';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Add Favorite Suburb
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Choose suburbs to add to your prospecting territory
            <Badge 
              variant={remainingSlots <= 1 ? "destructive" : "secondary"} 
              className="ml-1"
            >
              {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suburbs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 text-base"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[400px] pr-4 -mr-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : suburbs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {search ? 'No suburbs found' : 'No suburbs available'}
              </p>
              <p className="text-sm mt-1">
                {search ? 'Try a different search term' : 'Upload sales data to see suburbs'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recommended section - only show when not searching */}
              {!search && recommendedSuburbs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-warning" />
                    Most Active Suburbs
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {recommendedSuburbs.map((suburb) => (
                      <button
                        key={suburb.suburb}
                        onClick={() => handleAdd(suburb.suburb, suburb.city)}
                        disabled={remainingSlots <= 0 || addFavorite.isPending || suburb.isFavorite}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all text-left group",
                          "bg-gradient-to-br hover:scale-[1.02] hover:shadow-lg",
                          suburb.isFavorite 
                            ? "opacity-60 cursor-not-allowed bg-muted" 
                            : getHeatColor(suburb.saleCount)
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm">{suburb.suburb}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {suburb.city}
                            </div>
                          </div>
                          {suburb.isFavorite ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-primary">{suburb.saleCount} sales</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All suburbs list */}
              <div>
                {!search && recommendedSuburbs.length > 0 && (
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    All Suburbs
                  </h3>
                )}
                <div className="space-y-1">
                  {suburbs.map((suburb) => (
                    <div
                      key={suburb.suburb}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        suburb.isFavorite
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card hover:bg-accent/10 border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-8 rounded-full",
                          suburb.saleCount >= 50 ? "bg-primary" :
                          suburb.saleCount >= 30 ? "bg-success" :
                          suburb.saleCount >= 15 ? "bg-warning" : "bg-muted"
                        )} />
                        <div>
                          <div className="font-medium">{suburb.suburb}</div>
                          <div className="text-xs text-muted-foreground">
                            {suburb.city && `${suburb.city} • `}{suburb.saleCount} recent sales
                          </div>
                        </div>
                      </div>
                      
                      {suburb.isFavorite ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Added
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdd(suburb.suburb, suburb.city)}
                          disabled={remainingSlots <= 0 || addFavorite.isPending}
                          className="gap-1 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
