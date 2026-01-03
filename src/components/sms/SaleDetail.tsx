import { formatDistanceToNow, format } from 'date-fns';
import { Home, Bed, Ruler, Calendar, Clock, MapPin, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import OpportunitiesList from './OpportunitiesList';
import SaleMap from './SaleMap';
import { NearbySale } from '@/hooks/useNearbySales';
import { Opportunity } from '@/hooks/useOpportunities';
import { useMarkSaleComplete } from '@/hooks/useSaleContactActions';

interface SaleDetailProps {
  sale: NearbySale;
  opportunities: Opportunity[];
  isLoadingOpportunities: boolean;
  onClose: () => void;
  onSendSMS: (opportunity: Opportunity) => void;
  onBulkSMS?: (opportunities: Opportunity[]) => void;
}

function cleanAddress(address: string): string {
  return address.replace(/"/g, '');
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatArea(area: number | null | undefined, unit: string): string {
  if (!area) return '';
  return `${area.toLocaleString()}${unit}`;
}

export default function SaleDetail({
  sale,
  opportunities,
  isLoadingOpportunities,
  onClose,
  onSendSMS,
  onBulkSMS,
}: SaleDetailProps) {
  const markComplete = useMarkSaleComplete();
  const saleDate = sale.sale_date ? new Date(sale.sale_date) : null;
  const hotOpportunities = opportunities.filter(o => o.neverContacted && o.sameStreet).length;
  const displayAddress = cleanAddress(sale.address);

  const handleMarkComplete = () => {
    markComplete.mutate({ saleId: sale.id, suburb: sale.suburb });
  };

  return (
    <div className="space-y-4">
      {/* Header with Close */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold">{displayAddress}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {sale.suburb}, {sale.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mark as Complete button */}
          {opportunities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkComplete}
              disabled={markComplete.isPending}
              className="gap-1.5 text-success border-success/50 hover:bg-success/10 hover:text-success"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price Banner */}
      <div className="p-4 rounded-xl gradient-primary text-primary-foreground">
        <div className="text-sm opacity-90 mb-1">Sale Price</div>
        <div className="text-3xl font-display font-bold">
          {formatPrice(sale.sale_price)}
        </div>
        {saleDate && (
          <div className="text-sm opacity-90 mt-1">
            Sold {formatDistanceToNow(saleDate, { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        {sale.bedrooms && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{sale.bedrooms}</div>
              <div className="text-xs text-muted-foreground">Bedrooms</div>
            </div>
          </div>
        )}
        {sale.property_type && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Home className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{sale.property_type}</div>
              <div className="text-xs text-muted-foreground">Type</div>
            </div>
          </div>
        )}
        {sale.floor_area && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{formatArea(sale.floor_area, 'm²')}</div>
              <div className="text-xs text-muted-foreground">Floor Area</div>
            </div>
          </div>
        )}
        {sale.land_area && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{formatArea(sale.land_area, 'm²')}</div>
              <div className="text-xs text-muted-foreground">Land Area</div>
            </div>
          </div>
        )}
        {sale.days_to_sell && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{sale.days_to_sell}</div>
              <div className="text-xs text-muted-foreground">Days to Sell</div>
            </div>
          </div>
        )}
        {saleDate && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{format(saleDate, 'MMM d')}</div>
              <div className="text-xs text-muted-foreground">Sale Date</div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <SaleMap 
        sale={sale} 
        opportunities={opportunities}
        mapboxToken={undefined} // Will use env var when configured
      />

      <Separator />

      {/* Opportunities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            Your Opportunities
            <Badge variant="secondary">{opportunities.length}</Badge>
          </h3>
          {hotOpportunities > 0 && (
            <Badge className="bg-success text-success-foreground">
              {hotOpportunities} hot
            </Badge>
          )}
        </div>
        
        <OpportunitiesList
          saleId={sale.id}
          opportunities={opportunities}
          isLoading={isLoadingOpportunities}
          onSendSMS={onSendSMS}
          onBulkSMS={onBulkSMS}
        />
      </div>
    </div>
  );
}
