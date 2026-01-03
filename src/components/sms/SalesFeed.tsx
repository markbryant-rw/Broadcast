import { useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import SaleCard from './SaleCard';
import { SaleWithOpportunities } from '@/hooks/useOpportunities';

interface SaleProgress {
  contacted: number;
  ignored: number;
  smsCount: number;
}

interface SalesFeedProps {
  sales: SaleWithOpportunities[];
  selectedSaleId: string | null;
  onSelectSale: (sale: SaleWithOpportunities) => void;
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  progressMap?: Record<string, SaleProgress>;
}

export default function SalesFeed({
  sales,
  selectedSaleId,
  onSelectSale,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  progressMap = {},
}: SalesFeedProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Set up intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-3 space-y-1.5 rounded-lg border bg-card">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-8" />
            </div>
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
      <div className="space-y-2 p-1">
        {sales.map(sale => (
          <SaleCard
            key={sale.id}
            sale={sale}
            isSelected={sale.id === selectedSaleId}
            onSelect={() => onSelectSale(sale)}
            progress={progressMap[sale.id]}
          />
        ))}
        
        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="py-2">
          {isFetchingNextPage && (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-3 space-y-1.5 rounded-lg border bg-card animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="h-5 w-8 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!hasNextPage && !isFetchingNextPage && sales.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>You've reached the end</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          {hasNextPage && !isFetchingNextPage && (
            <div className="h-4" /> 
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
