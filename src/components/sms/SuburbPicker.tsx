import { useState } from 'react';
import { Search, Plus, Check, MapPin } from 'lucide-react';
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

  const handleAdd = async (suburb: string, city: string | null) => {
    await addFavorite.mutateAsync({ suburb, city });
    if (currentCount + 1 >= 5) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Add Favorite Suburb
          </DialogTitle>
          <DialogDescription>
            Choose suburbs to add to your territory. 
            <Badge variant="secondary" className="ml-2">
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
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Suburb list */}
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : suburbs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'No suburbs found' : 'No suburbs available'}
            </div>
          ) : (
            <div className="space-y-1">
              {suburbs.map((suburb) => (
                <div
                  key={suburb.suburb}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    suburb.isFavorite
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card hover:bg-accent/5 border-border"
                  )}
                >
                  <div>
                    <div className="font-medium">{suburb.suburb}</div>
                    <div className="text-xs text-muted-foreground">
                      {suburb.city && `${suburb.city} • `}{suburb.saleCount} recent sales
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
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
