import { useState } from 'react';
import { Plus, X, MapPin, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  useFavoriteSuburbsWithCounts, 
  useRemoveFavoriteSuburb,
  useReorderFavoriteSuburbs 
} from '@/hooks/useSuburbFavorites';
import SuburbPicker from './SuburbPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SuburbSelectorProps {
  selectedSuburb: string | null;
  onSelectSuburb: (suburb: string | null) => void;
}

interface SuburbCardProps {
  suburb: string;
  saleCount: number;
  contactedCount: number;
  totalOpportunities: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

function SortableSuburbCard({ 
  suburb, 
  saleCount, 
  contactedCount, 
  totalOpportunities,
  isSelected, 
  onSelect, 
  onRemove 
}: SuburbCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: suburb });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progressPercent = totalOpportunities > 0 
    ? Math.round((contactedCount / totalOpportunities) * 100) 
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[120px]",
        isDragging && "opacity-50 z-50",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 cursor-grab opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Clickable content */}
      <button onClick={onSelect} className="w-full flex flex-col items-center">
        <span className="text-sm font-medium truncate max-w-[100px]">{suburb}</span>
        <span className="text-xs text-muted-foreground">{saleCount} sales</span>
        
        {/* Progress bar */}
        {totalOpportunities > 0 && (
          <div className="w-full mt-2 space-y-1">
            <Progress value={progressPercent} className="h-1.5" />
            <span className="text-[10px] text-muted-foreground">
              {contactedCount}/{totalOpportunities} contacted
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

export default function SuburbSelector({ selectedSuburb, onSelectSuburb }: SuburbSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: favorites = [], isLoading } = useFavoriteSuburbsWithCounts();
  const removeFavorite = useRemoveFavoriteSuburb();
  const reorderFavorites = useReorderFavoriteSuburbs();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((f) => f.suburb === active.id);
      const newIndex = favorites.findIndex((f) => f.suburb === over.id);
      
      const newOrder = arrayMove(favorites, oldIndex, newIndex);
      reorderFavorites.mutate(newOrder.map(f => f.suburb));
    }
  };

  const handleRemove = (e: React.MouseEvent, suburb: string) => {
    e.stopPropagation();
    removeFavorite.mutate(suburb);
    if (selectedSuburb === suburb) {
      onSelectSuburb(null);
    }
  };

  // Calculate totals for "All" card
  const totalSales = favorites.reduce((sum, f) => sum + f.saleCount, 0);
  const totalContacted = favorites.reduce((sum, f) => sum + f.contactedCount, 0);
  const totalOpportunities = favorites.reduce((sum, f) => sum + f.totalOpportunities, 0);
  const allProgressPercent = totalOpportunities > 0 
    ? Math.round((totalContacted / totalOpportunities) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 w-28 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-start">
        {/* All Suburbs card - when clicked, show all favorites */}
        {favorites.length > 0 && (
          <button
            onClick={() => onSelectSuburb(null)}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[120px]",
              selectedSuburb === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
            )}
          >
            <MapPin className="h-4 w-4 mb-1" />
            <span className="text-sm font-medium">All</span>
            <span className="text-xs text-muted-foreground">
              {totalSales} sales
            </span>
            {totalOpportunities > 0 && (
              <div className="w-full mt-2 space-y-1">
                <Progress value={allProgressPercent} className="h-1.5" />
                <span className="text-[10px] text-muted-foreground">
                  {totalContacted}/{totalOpportunities}
                </span>
              </div>
            )}
          </button>
        )}

        {/* Favorite suburb cards with drag-and-drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={favorites.map(f => f.suburb)}
            strategy={horizontalListSortingStrategy}
          >
            {favorites.map((fav) => (
              <SortableSuburbCard
                key={fav.suburb}
                suburb={fav.suburb}
                saleCount={fav.saleCount}
                contactedCount={fav.contactedCount}
                totalOpportunities={fav.totalOpportunities}
                isSelected={selectedSuburb === fav.suburb}
                onSelect={() => onSelectSuburb(fav.suburb === selectedSuburb ? null : fav.suburb)}
                onRemove={(e) => handleRemove(e, fav.suburb)}
              />
            ))}
          </SortableContext>
        </DndContext>

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
