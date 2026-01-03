import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Sparkles } from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import { Opportunity } from '@/hooks/useOpportunities';

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  onSendSMS: (opportunity: Opportunity) => void;
}

export default function OpportunitiesList({
  opportunities,
  isLoading,
  onSendSMS,
}: OpportunitiesListProps) {
  // Separate into priority groups
  const hotOpportunities = opportunities.filter(
    o => o.neverContacted && o.sameStreet
  );
  const neverContactedOpportunities = opportunities.filter(
    o => o.neverContacted && !o.sameStreet
  );
  const otherOpportunities = opportunities.filter(o => !o.neverContacted);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-sm mb-1">No Opportunities</h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          No contacts found in this suburb. Add contacts with addresses to see opportunities.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-500px)] min-h-[200px]">
      <div className="space-y-4">
        {/* Hot Opportunities */}
        {hotOpportunities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <Sparkles className="h-4 w-4" />
              Hot Opportunities ({hotOpportunities.length})
            </div>
            <div className="space-y-2">
              {hotOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.contact.id}
                  opportunity={opp}
                  onSendSMS={() => onSendSMS(opp)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Never Contacted */}
        {neverContactedOpportunities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-warning">
              Never Contacted ({neverContactedOpportunities.length})
            </div>
            <div className="space-y-2">
              {neverContactedOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.contact.id}
                  opportunity={opp}
                  onSendSMS={() => onSendSMS(opp)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Previously Contacted */}
        {otherOpportunities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Previously Contacted ({otherOpportunities.length})
            </div>
            <div className="space-y-2">
              {otherOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.contact.id}
                  opportunity={opp}
                  onSendSMS={() => onSendSMS(opp)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
