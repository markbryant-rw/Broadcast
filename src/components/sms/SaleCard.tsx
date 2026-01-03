import { formatDistanceToNow } from 'date-fns';
import { Home, Bed, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';

interface SaleCardProps {
  sale: SaleWithOpportunities;
  isSelected: boolean;
  onSelect: () => void;
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function SaleCard({ sale, isSelected, onSelect }: SaleCardProps) {
  const hasOpportunities = sale.opportunityCount > 0;
  const isHighValue = (sale.sale_price ?? 0) >= 1000000;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary'
          : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-3">
        {/* Address & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{sale.address}</h3>
            <p className="text-xs text-muted-foreground">{sale.suburb}, {sale.city}</p>
          </div>
          {isHighValue && (
            <Badge variant="default" className="gradient-accent text-accent-foreground shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Value
            </Badge>
          )}
        </div>

        {/* Price - Large */}
        <div className="text-xl font-display font-bold text-gradient">
          {formatPrice(sale.sale_price)}
        </div>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {sale.sale_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDaysAgo(sale.sale_date)}
            </span>
          )}
          {sale.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {sale.bedrooms} bed
            </span>
          )}
          {sale.property_type && (
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {sale.property_type}
            </span>
          )}
        </div>

        {/* Opportunities Badge */}
        <div className="pt-1">
          <Badge
            variant={hasOpportunities ? 'default' : 'secondary'}
            className={hasOpportunities ? 'bg-success text-success-foreground' : ''}
          >
            <Users className="h-3 w-3 mr-1" />
            {sale.opportunityCount} {sale.opportunityCount === 1 ? 'opportunity' : 'opportunities'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
