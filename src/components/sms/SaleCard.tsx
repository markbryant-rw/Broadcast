import { formatDistanceToNow } from 'date-fns';
import { Bed, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';

interface SaleCardProps {
  sale: SaleWithOpportunities;
  isSelected: boolean;
  onSelect: () => void;
}

function cleanAddress(address: string): string {
  return address.replace(/"/g, '');
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
    // Shorten "about X days" to "Xd", etc.
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

export default function SaleCard({ sale, isSelected, onSelect }: SaleCardProps) {
  const hasOpportunities = sale.opportunityCount > 0;
  const isHighValue = (sale.sale_price ?? 0) >= 1000000;

  return (
    <Card
      className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary'
          : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-1.5">
        {/* Row 1: Address + Price + High Value indicator */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate flex-1 min-w-0">
            {cleanAddress(sale.address)}
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

        {/* Row 2: Meta info + Opportunities */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span className="truncate">{sale.suburb}</span>
            {sale.bedrooms && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Bed className="h-3 w-3" />
                  {sale.bedrooms}
                </span>
              </>
            )}
            {sale.sale_date && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {formatDaysAgo(sale.sale_date)}
                </span>
              </>
            )}
          </div>
          <Badge
            variant={hasOpportunities ? 'default' : 'secondary'}
            className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${hasOpportunities ? 'bg-success text-success-foreground' : ''}`}
          >
            <Users className="h-2.5 w-2.5 mr-0.5" />
            {sale.opportunityCount}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
