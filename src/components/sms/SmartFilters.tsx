import { Timer } from 'lucide-react';
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
import { SmartFilters as SmartFiltersType, DateRange, CooldownPeriod } from '@/hooks/useSmartFilters';

interface SmartFiltersProps {
  filters: SmartFiltersType;
  onUpdateFilter: <K extends keyof SmartFiltersType>(key: K, value: SmartFiltersType[K]) => void;
  salesCount: number;
}

export default function SmartFilters({
  filters,
  onUpdateFilter,
  salesCount,
}: SmartFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range */}
      <Select
        value={filters.dateRange}
        onValueChange={(value: DateRange) => onUpdateFilter('dateRange', value)}
      >
        <SelectTrigger className="w-[130px] bg-background">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>

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
  );
}
