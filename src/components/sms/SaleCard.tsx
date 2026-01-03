import { formatDistanceToNow } from 'date-fns';
import { Bed, Calendar, TrendingUp, CheckCircle, MessageSquare, Users, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';
import { useMarkSaleComplete } from '@/hooks/useSaleContactActions';
import { cn } from '@/lib/utils';

interface SaleProgress {
  contacted: number;
  ignored: number;
  smsCount: number;
}

interface SaleCardProps {
  sale: SaleWithOpportunities;
  isSelected: boolean;
  onSelect: () => void;
  progress?: SaleProgress;
}

function cleanAddress(address: string): string {
  return address.replace(/"/g, '');
}

function getDisplayAddress(address: string, suburb: string): string {
  const cleaned = cleanAddress(address);
  // If address doesn't include suburb, append it
  if (!cleaned.toLowerCase().includes(suburb.toLowerCase())) {
    return `${cleaned}, ${suburb}`;
  }
  return cleaned;
}

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const distance = formatDistanceToNow(new Date(dateString), { addSuffix: false });
    return distance
      .replace('about ', '')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace(' weeks', 'w')
      .replace(' week', 'w');
  } catch {
    return '';
  }
}

function getAccentColor(progressPercent: number, hasOpportunities: boolean): string {
  if (!hasOpportunities) return 'border-l-muted-foreground/30';
  if (progressPercent >= 100) return 'border-l-success';
  if (progressPercent >= 50) return 'border-l-warning';
  if (progressPercent > 0) return 'border-l-warning';
  return 'border-l-primary';
}

function getProgressBarColor(progressPercent: number): string {
  if (progressPercent >= 100) return 'bg-success';
  if (progressPercent >= 50) return 'bg-warning';
  if (progressPercent > 0) return 'bg-warning';
  return 'bg-primary';
}

export default function SaleCard({ sale, isSelected, onSelect, progress }: SaleCardProps) {
  const markComplete = useMarkSaleComplete();
  
  const totalOpportunities = sale.opportunityCount;
  const actioned = (progress?.contacted || 0) + (progress?.ignored || 0);
  const remaining = Math.max(0, totalOpportunities - actioned);
  const isComplete = totalOpportunities > 0 && remaining === 0;
  const progressPercent = totalOpportunities > 0 
    ? Math.round((actioned / totalOpportunities) * 100) 
    : 0;

  const isHighValue = (sale.sale_price ?? 0) >= 1000000;
  const displayAddress = getDisplayAddress(sale.address, sale.suburb);

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    markComplete.mutate({ 
      saleId: sale.id, 
      suburb: sale.suburb 
    });
  };

  // Completed state - single line
  if (isComplete) {
    return (
      <Card
        className={`cursor-pointer transition-all duration-200 border-dashed bg-muted/20 hover:bg-muted/40 border-l-4 border-l-success ${
          isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <CheckCircle className="h-4 w-4 text-success shrink-0" />
          <span className="flex-1 truncate text-sm font-medium text-muted-foreground">{displayAddress}</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
            <MessageSquare className="h-3 w-3" />
            {progress?.smsCount || 0}
          </span>
          <Badge variant="outline" className="text-success border-success/50 text-[10px] px-1.5 py-0 h-5">
            Complete
          </Badge>
        </div>
      </Card>
    );
  }

  // Active state with two-column layout
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4",
        getAccentColor(progressPercent, totalOpportunities > 0),
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-md'
          : 'hover:border-primary/50 hover:bg-accent/30'
      )}
      onClick={onSelect}
    >
      <div className="p-3 space-y-2">
        {/* Row 1: Address + Price + Mark Complete */}
        <div className="flex items-start justify-between gap-2">
          {/* Left: Address */}
          <h3 className="font-semibold text-sm leading-tight flex-1 min-w-0 line-clamp-2">
            {displayAddress}
          </h3>
          {/* Right: Price + High value indicator + Mark Complete */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-sm text-foreground">
              {formatPrice(sale.sale_price)}
            </span>
            {isHighValue && (
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            )}
            {/* Mark as Complete button - visible on hover */}
            {totalOpportunities > 0 && remaining > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-success/20 hover:text-success"
                onClick={handleMarkComplete}
                disabled={markComplete.isPending}
                title="Mark all as done"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Meta + Progress */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Beds + Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {sale.bedrooms && (
              <span className="flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5">
                <Bed className="h-3 w-3" />
                {sale.bedrooms}
              </span>
            )}
            {sale.sale_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDaysAgo(sale.sale_date)}
              </span>
            )}
          </div>

          {/* Right: Progress visualization or "No contacts" */}
          {totalOpportunities > 0 ? (
            <div className="flex items-center gap-2 shrink-0">
              {/* Progress bar */}
              <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressBarColor(progressPercent)}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Count */}
              <span className={`text-xs font-medium min-w-[2.5rem] text-right ${remaining > 0 ? 'text-foreground' : 'text-success'}`}>
                {remaining > 0 ? (
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    {remaining}
                  </span>
                ) : (
                  '✓'
                )}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/70 italic">
              No nearby contacts
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
