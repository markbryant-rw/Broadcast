import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SMSLayout from '@/components/layout/SMSLayout';
import SuburbSelector from '@/components/sms/SuburbSelector';
import SalesFeed from '@/components/sms/SalesFeed';
import SaleDetail from '@/components/sms/SaleDetail';
import QuickSMSComposer from '@/components/sms/QuickSMSComposer';
import BulkSMSComposer from '@/components/sms/BulkSMSComposer';
import ProspectingStatsWidget from '@/components/sms/ProspectingStatsWidget';
import { useNearbySalesPaginated, NearbySale } from '@/hooks/useNearbySales';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import { useFavoriteSuburbs } from '@/hooks/useSuburbFavorites';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSalesWithOpportunities, useOpportunitiesForSale, Opportunity, SaleWithOpportunities } from '@/hooks/useOpportunities';
import { useSaleProgressMap } from '@/hooks/useSaleProgress';
import { useSaleCompletionMap } from '@/hooks/useSaleCompletions';
import { MessageSquare, TrendingUp, BarChart3, ChevronDown } from 'lucide-react';

// Combined Suburb Selector + Analytics Toggle component
function SuburbSelectorWithAnalytics({
  selectedSuburb,
  onSelectSuburb,
  hasNoFavorites,
}: {
  selectedSuburb: string | null;
  onSelectSuburb: (suburb: string | null) => void;
  hasNoFavorites: boolean;
}) {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-4 space-y-4">
        {/* Row: Suburbs (2/3) + Analytics Toggle (1/3) */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Suburb Selector - takes 2/3 */}
          <div className="flex-1 lg:flex-[2]">
            <SuburbSelector 
              selectedSuburb={selectedSuburb}
              onSelectSuburb={onSelectSuburb}
            />
          </div>
          
          {/* Analytics Toggle - takes 1/3 */}
          {!hasNoFavorites && (
            <div className="lg:flex-1 flex items-start">
              <Button
                variant={analyticsOpen ? "default" : "outline"}
                className="w-full lg:w-auto gap-2 h-auto py-3"
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Collapsible Analytics Panel */}
        {!hasNoFavorites && (
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <CollapsibleContent className="pt-4 border-t">
              <ProspectingStatsWidget />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default function SMS() {
  const { 
    data: salesPages, 
    isLoading: isLoadingSales,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNearbySalesPaginated();
  const { data: favorites = [] } = useFavoriteSuburbs();
  const { filters, updateFilter, filterSales } = useSmartFilters();
  const { data: userSettings } = useUserSettings();
  
  // Use cooldown from user settings
  const cooldownDays = userSettings?.cooldownDays ?? filters.cooldownDays;
  
  // Track selected suburb (for filtering within favorites)
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  
  // Flatten paginated sales
  const rawSales = useMemo(() => {
    return salesPages?.pages.flatMap(page => page.sales) || [];
  }, [salesPages]);
  
  // Filter to favorite suburbs first
  const favoriteSuburbs = useMemo(() => new Set(favorites.map(f => f.suburb.toLowerCase())), [favorites]);
  
  const salesInFavoriteSuburbs = useMemo(() => {
    if (favoriteSuburbs.size === 0) return [];
    return rawSales.filter(sale => favoriteSuburbs.has(sale.suburb.toLowerCase()));
  }, [rawSales, favoriteSuburbs]);
  
  // Apply selected suburb filter
  const salesInSelectedSuburb = useMemo(() => {
    if (!selectedSuburb) return salesInFavoriteSuburbs;
    return salesInFavoriteSuburbs.filter(sale => 
      sale.suburb.toLowerCase() === selectedSuburb.toLowerCase()
    );
  }, [salesInFavoriteSuburbs, selectedSuburb]);
  
  // Apply other filters (date, etc.)
  const filteredSales = filterSales(salesInSelectedSuburb);
  
  // Get sales with opportunity counts
  const { data: salesWithOpportunities = [] } = useSalesWithOpportunities(filteredSales);
  
  // Get progress data for visible sales
  const saleIds = salesWithOpportunities.map(s => s.id);
  const { data: progressMap = {} } = useSaleProgressMap(saleIds);
  
  // Get sale completion status
  const completionMap = useSaleCompletionMap();
  
  // Apply hide completed filter
  const displaySales = useMemo(() => {
    if (!filters.hideCompleted) return salesWithOpportunities;
    return salesWithOpportunities.filter(sale => {
      // If sale is explicitly marked complete, hide it
      if (completionMap.has(sale.id)) return false;
      
      // If all opportunities are actioned, hide it
      const progress = progressMap[sale.id];
      const actioned = (progress?.contacted || 0) + (progress?.ignored || 0);
      const remaining = sale.opportunityCount - actioned;
      
      // Show if: has no opportunities (nothing to do) OR has remaining opportunities
      return sale.opportunityCount === 0 || remaining > 0;
    });
  }, [salesWithOpportunities, progressMap, completionMap, filters.hideCompleted]);
  
  // Selected sale state
  const [selectedSale, setSelectedSale] = useState<SaleWithOpportunities | null>(null);
  
  // Get opportunities for selected sale (with cooldown filter)
  const { data: opportunities = [], isLoading: isLoadingOppDetails } = 
    useOpportunitiesForSale(selectedSale, cooldownDays);
  
  // SMS composer state
  const [smsComposerOpen, setSmsComposerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  
  // Bulk SMS state
  const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
  const [bulkOpportunities, setBulkOpportunities] = useState<Opportunity[]>([]);
  
  // Mobile detail sheet state
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const handleSelectSale = (sale: SaleWithOpportunities) => {
    setSelectedSale(sale);
    if (window.innerWidth < 1024) {
      setDetailSheetOpen(true);
    }
  };

  const handleSendSMS = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setSmsComposerOpen(true);
  };

  const handleCloseSmsComposer = () => {
    setSmsComposerOpen(false);
    setSelectedOpportunity(null);
  };

  const handleBulkSMS = (opportunities: Opportunity[]) => {
    setBulkOpportunities(opportunities);
    setBulkSmsOpen(true);
  };

  const handleCloseBulkSms = () => {
    setBulkSmsOpen(false);
    setBulkOpportunities([]);
  };

  // Calculate stats
  const totalOpportunities = displaySales.reduce((sum, s) => sum + s.opportunityCount, 0);
  const hotSales = displaySales.filter(s => s.opportunityCount > 0).length;

  // Check if user has no favorites yet
  const hasNoFavorites = favorites.length === 0;

  return (
    <SMSLayout>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              SMS Prospecting
            </h1>
            <p className="text-muted-foreground mt-1">
              Find opportunities from recent sales and reach out instantly
            </p>
          </div>

          {/* Quick Stats */}
          {!hasNoFavorites && (
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">{displaySales.length}</div>
                <div className="text-xs text-muted-foreground">Recent Sales</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success">{totalOpportunities}</div>
                <div className="text-xs text-muted-foreground">Opportunities</div>
              </div>
            </div>
          )}
        </div>

        {/* Suburb Selector + Analytics Toggle */}
        <SuburbSelectorWithAnalytics
          selectedSuburb={selectedSuburb}
          onSelectSuburb={setSelectedSuburb}
          hasNoFavorites={hasNoFavorites}
        />

        {/* Show content only if user has favorites */}
        {!hasNoFavorites && (
          <>

            {/* Main Content - Two Panel Layout */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Sales Feed - Left Panel */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Recent Sales
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Hide completed toggle - moved inline */}
                        <div className="flex items-center gap-2">
                          <Switch
                            id="hide-completed"
                            checked={filters.hideCompleted}
                            onCheckedChange={(checked) => updateFilter('hideCompleted', checked)}
                            className="scale-90"
                          />
                          <Label htmlFor="hide-completed" className="text-xs font-normal text-muted-foreground cursor-pointer whitespace-nowrap">
                            Hide done
                          </Label>
                        </div>
                        {hotSales > 0 && (
                          <span className="text-sm font-normal text-success">
                            {hotSales} hot
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <SalesFeed
                      sales={displaySales}
                      selectedSaleId={selectedSale?.id || null}
                      onSelectSale={handleSelectSale}
                      isLoading={isLoadingSales}
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      onLoadMore={() => fetchNextPage()}
                      progressMap={progressMap}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sale Detail - Right Panel (Desktop) */}
              <div className="lg:col-span-3 hidden lg:block">
                <Card className="h-full">
                  <CardContent className="p-6">
                    {selectedSale ? (
                      <SaleDetail
                        sale={selectedSale}
                        opportunities={opportunities}
                        isLoadingOpportunities={isLoadingOppDetails}
                        onClose={() => setSelectedSale(null)}
                        onSendSMS={handleSendSMS}
                        onBulkSMS={handleBulkSMS}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[500px] text-center">
                        <div className="rounded-full bg-muted p-6 mb-4">
                          <MessageSquare className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Select a Sale</h3>
                        <p className="text-muted-foreground max-w-[300px]">
                          Click on a recent sale from the list to see your opportunities and send personalized SMS messages.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          {selectedSale && (
            <SaleDetail
              sale={selectedSale}
              opportunities={opportunities}
              isLoadingOpportunities={isLoadingOppDetails}
              onClose={() => setDetailSheetOpen(false)}
              onSendSMS={handleSendSMS}
              onBulkSMS={handleBulkSMS}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Quick SMS Composer */}
      <QuickSMSComposer
        opportunity={selectedOpportunity}
        sale={selectedSale}
        isOpen={smsComposerOpen}
        onClose={handleCloseSmsComposer}
      />

      {/* Bulk SMS Composer */}
      <BulkSMSComposer
        opportunities={bulkOpportunities}
        sale={selectedSale}
        isOpen={bulkSmsOpen}
        onClose={handleCloseBulkSms}
      />
    </SMSLayout>
  );
}
