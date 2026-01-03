import { useNavigate } from 'react-router-dom';
import { Flame, ArrowRight, MessageSquare, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHotOpportunities, HotOpportunity } from '@/hooks/useHotOpportunities';

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(price);
}

function OpportunityRow({ opportunity }: { opportunity: HotOpportunity }) {
  const navigate = useNavigate();

  const handleSendSMS = () => {
    // Navigate to SMS page with sale pre-selected
    navigate(`/sms?saleId=${opportunity.saleId}`);
  };

  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {opportunity.contactName}
          </span>
          {opportunity.daysSinceContact === null ? (
            <Badge variant="default" className="bg-success/20 text-success text-xs shrink-0">
              Never contacted
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              {opportunity.daysSinceContact}d ago
            </Badge>
          )}
        </div>
        {opportunity.contactAddress && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{opportunity.contactAddress}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">Sale:</span>{' '}
          {opportunity.saleAddress} • {formatPrice(opportunity.salePrice)}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 h-8 gap-1 text-success hover:text-success hover:bg-success/10"
        onClick={handleSendSMS}
      >
        <MessageSquare className="h-4 w-4" />
        SMS
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="text-center py-6 space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Flame className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No hot opportunities yet</p>
        <p className="text-xs text-muted-foreground">
          Upload recent sales data to discover contacts near sold properties
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/sms')}>
        Go to SMS Hub
      </Button>
    </div>
  );
}

export default function HotOpportunitiesWidget() {
  const { data: opportunities, isLoading } = useHotOpportunities(5);
  const navigate = useNavigate();

  const opportunityCount = opportunities?.length || 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Hot Opportunities
            {opportunityCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({opportunityCount} ready)
              </span>
            )}
          </CardTitle>
        </div>
        {opportunityCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => navigate('/sms')}
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : opportunityCount === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {opportunities?.map(opp => (
              <OpportunityRow key={`${opp.contactId}-${opp.saleId}`} opportunity={opp} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
