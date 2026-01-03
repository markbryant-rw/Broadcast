import { formatDistanceToNow } from 'date-fns';
import { Bed, Calendar, TrendingUp, CheckCircle, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';

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

function getStreetOnly(address: string, suburb: string): string {
  // Remove suburb from end of address and trailing comma
  const cleaned = cleanAddress(address);
  const suburbPattern = new RegExp(`,?\\s*${suburb}\\s*$`, 'i');
  return cleaned.replace(suburbPattern, '').trim();
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

function getProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-success';
  if (percent >= 50) return 'bg-warning';
  if (percent > 0) return 'bg-primary';
  return 'bg-destructive';
}

export default function SaleCard({ sale, isSelected, onSelect, progress }: SaleCardProps) {
  const totalOpportunities = sale.opportunityCount;
  const actioned = (progress?.contacted || 0) + (progress?.ignored || 0);
  const remaining = Math.max(0, totalOpportunities - actioned);
  const isComplete = totalOpportunities > 0 && remaining === 0;
  const progressPercent = totalOpportunities > 0 
    ? Math.round((actioned / totalOpportunities) * 100) 
    : 0;

  const isHighValue = (sale.sale_price ?? 0) >= 1000000;
  const streetOnly = getStreetOnly(sale.address, sale.suburb);

  // Completed state - single line
  if (isComplete) {
    return (
      <Card
        className={`p-2.5 cursor-pointer transition-all duration-200 border-dashed bg-muted/30 opacity-80 hover:opacity-100 ${
          isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-4 w-4 text-success shrink-0" />
          <span className="flex-1 truncate font-medium">{streetOnly}</span>
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

  // Active state with progress
  return (
    <Card
      className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary'
          : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-2">
        {/* Row 1: Address + Price + High Value indicator */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate flex-1 min-w-0">
            {streetOnly}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-sm">
              {formatPrice(sale.sale_price)}
            </span>
            {isHighValue && (
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
        </div>

        {/* Row 2: Meta info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {sale.bedrooms && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Bed className="h-3 w-3" />
              {sale.bedrooms}
            </span>
          )}
          {sale.bedrooms && sale.sale_date && <span className="text-border">·</span>}
          {sale.sale_date && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Calendar className="h-3 w-3" />
              {formatDaysAgo(sale.sale_date)}
            </span>
          )}
        </div>

        {/* Row 3: Progress visualization */}
        {totalOpportunities > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${remaining > 0 ? 'text-foreground' : 'text-success'}`}>
                {remaining > 0 ? (
                  <>{remaining} remaining</>
                ) : (
                  <>All contacted</>
                )}
              </span>
              <span className="text-muted-foreground">
                {actioned}/{totalOpportunities}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(progressPercent)}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* No opportunities state */}
        {totalOpportunities === 0 && (
          <div className="text-xs text-muted-foreground italic">
            No contacts in this area
          </div>
        )}
      </div>
    </Card>
  );
}
