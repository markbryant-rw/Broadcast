import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import SMSLayout from '@/components/layout/SMSLayout';
import SmartFilters from '@/components/sms/SmartFilters';
import SalesFeed from '@/components/sms/SalesFeed';
import SaleDetail from '@/components/sms/SaleDetail';
import QuickSMSComposer from '@/components/sms/QuickSMSComposer';
import BulkSMSComposer from '@/components/sms/BulkSMSComposer';
import SMSTemplateManager from '@/components/sms/SMSTemplateManager';
import SMSLogTable from '@/components/sms/SMSLogTable';
import SalesUploader from '@/components/sales/SalesUploader';
import SalesDataTable from '@/components/sales/SalesDataTable';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useNearbySalesPaginated, NearbySale } from '@/hooks/useNearbySales';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import { useSalesWithOpportunities, useOpportunitiesForSale, useSuburbsList, Opportunity, SaleWithOpportunities } from '@/hooks/useOpportunities';
import { useSaleProgressMap } from '@/hooks/useSaleProgress';
import { MessageSquare, Sparkles, History, FileText, Database, TrendingUp } from 'lucide-react';

export default function SMS() {
  const { isPlatformAdmin } = usePlatformAdmin();
  const { 
    data: salesPages, 
    isLoading: isLoadingSales,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNearbySalesPaginated();
  const { data: suburbs = [] } = useSuburbsList();
  const { filters, updateFilter, setPreset, filterSales } = useSmartFilters();
  
  // Flatten paginated sales
  const rawSales = useMemo(() => {
    return salesPages?.pages.flatMap(page => page.sales) || [];
  }, [salesPages]);
  
  // Filter sales
  const filteredSales = filterSales(rawSales);
  
  // Get sales with opportunity counts
  const { data: salesWithOpportunities = [] } = useSalesWithOpportunities(filteredSales);
  
  // Get progress data for visible sales
  const saleIds = salesWithOpportunities.map(s => s.id);
  const { data: progressMap = {} } = useSaleProgressMap(saleIds);
  
  // Apply hide completed filter
  const displaySales = useMemo(() => {
    if (!filters.hideCompleted) return salesWithOpportunities;
    return salesWithOpportunities.filter(sale => {
      const progress = progressMap[sale.id];
      const actioned = (progress?.contacted || 0) + (progress?.ignored || 0);
      const remaining = sale.opportunityCount - actioned;
      // Hide if all opportunities are completed (and there were some to begin with)
      return sale.opportunityCount === 0 || remaining > 0;
    });
  }, [salesWithOpportunities, progressMap, filters.hideCompleted]);
  
  // Selected sale state
  const [selectedSale, setSelectedSale] = useState<SaleWithOpportunities | null>(null);
  
  // Get opportunities for selected sale
  const { data: opportunities = [], isLoading: isLoadingOppDetails } = 
    useOpportunitiesForSale(selectedSale);
  
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
    // On mobile, open the detail sheet
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

  return (
    <SMSLayout>
      <div className="space-y-6">
        <Tabs defaultValue="opportunities" className="space-y-6">
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
          </div>

          {/* Tab Navigation */}
          <TabsList className="w-full justify-start bg-muted/50 p-1">
            <TabsTrigger value="opportunities" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            {isPlatformAdmin && (
              <TabsTrigger value="sales" className="gap-2">
                <Database className="h-4 w-4" />
                Sales Data
              </TabsTrigger>
            )}
          </TabsList>

          {/* Opportunities Tab - Main Feature */}
          <TabsContent value="opportunities" className="space-y-6 mt-0">
            {/* Smart Filters */}
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <SmartFilters
                  filters={filters}
                  onUpdateFilter={updateFilter}
                  onSetPreset={setPreset}
                  suburbs={suburbs}
                  salesCount={displaySales.length}
                />
              </CardContent>
            </Card>

            {/* Main Content - Three Panel Layout */}
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
                      {hotSales > 0 && (
                        <span className="text-sm font-normal text-success">
                          {hotSales} with opportunities
                        </span>
                      )}
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
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <SMSTemplateManager />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>SMS History</CardTitle>
                <CardDescription>
                  View all SMS messages sent through the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SMSLogTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Data Tab - Platform Admin Only */}
          {isPlatformAdmin && (
            <TabsContent value="sales" className="space-y-6">
              <SalesUploader />
              <SalesDataTable />
            </TabsContent>
          )}
        </Tabs>
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
