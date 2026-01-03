import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import SaleCard from './SaleCard';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';

interface SalesFeedProps {
  sales: SaleWithOpportunities[];
  selectedSaleId: string | null;
  onSelectSale: (sale: SaleWithOpportunities) => void;
  isLoading: boolean;
}

export default function SalesFeed({
  sales,
  selectedSaleId,
  onSelectSale,
  isLoading,
}: SalesFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3 rounded-lg border bg-card">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-7 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No Sales Found</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Try adjusting your filters or upload sales data to see opportunities.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-3 p-1">
        {sales.map(sale => (
          <SaleCard
            key={sale.id}
            sale={sale}
            isSelected={sale.id === selectedSaleId}
            onSelect={() => onSelectSale(sale)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
