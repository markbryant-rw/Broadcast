import { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFavoriteSuburbsWithCounts, useRemoveFavoriteSuburb } from '@/hooks/useSuburbFavorites';
import SuburbPicker from './SuburbPicker';

interface SuburbSelectorProps {
  selectedSuburb: string | null;
  onSelectSuburb: (suburb: string | null) => void;
}

export default function SuburbSelector({ selectedSuburb, onSelectSuburb }: SuburbSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: favorites = [], isLoading } = useFavoriteSuburbsWithCounts();
  const removeFavorite = useRemoveFavoriteSuburb();

  const handleRemove = (e: React.MouseEvent, suburb: string) => {
    e.stopPropagation();
    removeFavorite.mutate(suburb);
    if (selectedSuburb === suburb) {
      onSelectSuburb(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 w-28 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* All Suburbs card - when clicked, show all favorites */}
        {favorites.length > 0 && (
          <button
            onClick={() => onSelectSuburb(null)}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[100px]",
              selectedSuburb === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
            )}
          >
            <MapPin className="h-4 w-4 mb-1" />
            <span className="text-sm font-medium">All</span>
            <span className="text-xs text-muted-foreground">
              {favorites.reduce((sum, f) => sum + f.saleCount, 0)} sales
            </span>
          </button>
        )}

        {/* Favorite suburb cards */}
        {favorites.map((fav) => (
          <button
            key={fav.suburb}
            onClick={() => onSelectSuburb(fav.suburb === selectedSuburb ? null : fav.suburb)}
            className={cn(
              "group relative flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[100px]",
              selectedSuburb === fav.suburb
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
            )}
          >
            {/* Remove button */}
            <button
              onClick={(e) => handleRemove(e, fav.suburb)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium truncate max-w-[100px]">{fav.suburb}</span>
            <span className="text-xs text-muted-foreground">{fav.saleCount} sales</span>
          </button>
        ))}

        {/* Add suburb button */}
        {favorites.length < 5 && (
          <button
            onClick={() => setPickerOpen(true)}
            className="flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/5 transition-all min-w-[100px] text-muted-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4 mb-1" />
            <span className="text-sm">Add suburb</span>
            <span className="text-xs">{5 - favorites.length} left</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
          <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Choose your suburbs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add up to 5 favorite suburbs to see sales in your territory
          </p>
          <Button onClick={() => setPickerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Suburb
          </Button>
        </div>
      )}

      {/* Selected suburb indicator */}
      {selectedSuburb && (
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          Showing: {selectedSuburb}
        </Badge>
      )}

      <SuburbPicker 
        open={pickerOpen} 
        onOpenChange={setPickerOpen}
        currentCount={favorites.length}
      />
    </div>
  );
}
