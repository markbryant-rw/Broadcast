import { Search, Sparkles, DollarSign, MapPin, Clock, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SmartFilters as SmartFiltersType, FilterPreset, DateRange, PriceRange, CooldownPeriod } from '@/hooks/useSmartFilters';

interface SmartFiltersProps {
  filters: SmartFiltersType;
  onUpdateFilter: <K extends keyof SmartFiltersType>(key: K, value: SmartFiltersType[K]) => void;
  onSetPreset: (preset: FilterPreset) => void;
  suburbs: string[];
  salesCount: number;
}

const presets: { id: FilterPreset; label: string; icon: React.ReactNode }[] = [
  { id: 'recent', label: 'Recent Sales', icon: <Clock className="h-3.5 w-3.5" /> },
  { id: 'smart-match', label: 'Smart Match', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'high-value', label: 'High Value', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { id: 'by-suburb', label: 'By Suburb', icon: <MapPin className="h-3.5 w-3.5" /> },
];

export default function SmartFilters({
  filters,
  onUpdateFilter,
  onSetPreset,
  suburbs,
  salesCount,
}: SmartFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <Button
            key={preset.id}
            variant={filters.preset === preset.id ? 'default' : 'outline'}
            size="sm"
            className={`gap-1.5 ${
              filters.preset === preset.id
                ? 'gradient-primary text-primary-foreground border-0'
                : ''
            }`}
            onClick={() => onSetPreset(preset.id)}
          >
            {preset.icon}
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search address or suburb..."
            value={filters.searchQuery}
            onChange={e => onUpdateFilter('searchQuery', e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        {/* Date Range */}
        <Select
          value={filters.dateRange}
          onValueChange={(value: DateRange) => onUpdateFilter('dateRange', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Range */}
        <Select
          value={filters.priceRange}
          onValueChange={(value: PriceRange) => onUpdateFilter('priceRange', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Price range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any price</SelectItem>
            <SelectItem value="under500k">Under $500k</SelectItem>
            <SelectItem value="500k-1m">$500k - $1M</SelectItem>
            <SelectItem value="over1m">Over $1M</SelectItem>
          </SelectContent>
        </Select>

        {/* Suburb Filter */}
        {filters.preset === 'by-suburb' && (
          <Select
            value={filters.suburb || 'all'}
            onValueChange={value => onUpdateFilter('suburb', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All suburbs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suburbs</SelectItem>
              {suburbs.map(suburb => (
                <SelectItem key={suburb} value={suburb}>
                  {suburb}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Cooldown Period Selector */}
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.cooldownDays.toString()}
            onValueChange={(value) => onUpdateFilter('cooldownDays', parseInt(value) as CooldownPeriod)}
          >
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Cooldown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 day cooldown</SelectItem>
              <SelectItem value="7">7 day cooldown</SelectItem>
              <SelectItem value="14">14 day cooldown</SelectItem>
              <SelectItem value="30">30 day cooldown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hide Completed Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="hide-completed"
            checked={filters.hideCompleted}
            onCheckedChange={(checked) => onUpdateFilter('hideCompleted', checked)}
          />
          <Label htmlFor="hide-completed" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
            Hide completed
          </Label>
        </div>

        {/* Results Count Badge */}
        <Badge variant="secondary" className="ml-auto">
          {salesCount} {salesCount === 1 ? 'sale' : 'sales'}
        </Badge>
      </div>
    </div>
  );
}
