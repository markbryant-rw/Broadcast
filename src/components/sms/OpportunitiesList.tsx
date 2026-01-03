import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Sparkles, Send, CheckSquare, Square, ChevronDown, Timer } from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import { Opportunity } from '@/hooks/useOpportunities';

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  onSendSMS: (opportunity: Opportunity) => void;
  onBulkSMS?: (opportunities: Opportunity[]) => void;
}

export default function OpportunitiesList({
  opportunities,
  isLoading,
  onSendSMS,
  onBulkSMS,
}: OpportunitiesListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isCooldownOpen, setIsCooldownOpen] = useState(false);

  // Separate opportunities: available vs on cooldown
  const availableOpportunities = opportunities.filter(o => !o.isOnCooldown);
  const cooldownOpportunities = opportunities.filter(o => o.isOnCooldown);

  // Separate available into priority groups
  const hotOpportunities = availableOpportunities.filter(
    o => o.neverContacted && o.sameStreet
  );
  const neverContactedOpportunities = availableOpportunities.filter(
    o => o.neverContacted && !o.sameStreet
  );
  const otherOpportunities = availableOpportunities.filter(o => !o.neverContacted);

  // Filter to only those with phone numbers AND not on cooldown
  const selectableOpportunities = availableOpportunities.filter(o => o.contact.phone);

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedIds(new Set());
    }
    setIsSelectMode(!isSelectMode);
  };

  const toggleSelection = (contactId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(selectableOpportunities.map(o => o.contact.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleBulkSMS = () => {
    if (selectedIds.size === 0 || !onBulkSMS) return;
    const selected = availableOpportunities.filter(o => selectedIds.has(o.contact.id));
    onBulkSMS(selected);
  };

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

  const renderOpportunityCard = (opp: Opportunity) => {
    const hasPhone = !!opp.contact.phone;
    const canSelect = hasPhone && !opp.isOnCooldown;
    
    if (isSelectMode && !opp.isOnCooldown) {
      return (
        <div
          key={opp.contact.id}
          className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${
            selectedIds.has(opp.contact.id) ? 'bg-primary/10' : ''
          }`}
        >
          <Checkbox
            checked={selectedIds.has(opp.contact.id)}
            onCheckedChange={() => toggleSelection(opp.contact.id)}
            disabled={!canSelect}
            className="ml-2"
          />
          <div className="flex-1">
            <OpportunityCard
              opportunity={opp}
              onSendSMS={() => onSendSMS(opp)}
              hideButton={isSelectMode}
            />
          </div>
        </div>
      );
    }

    return (
      <OpportunityCard
        key={opp.contact.id}
        opportunity={opp}
        onSendSMS={() => onSendSMS(opp)}
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* Bulk Actions Bar */}
      {onBulkSMS && selectableOpportunities.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleSelectMode}
              className="gap-1.5"
            >
              {isSelectMode ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Exit Select
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Select Multiple
                </>
              )}
            </Button>
            
            {isSelectMode && (
              <>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All ({selectableOpportunities.length})
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>
                  Clear
                </Button>
              </>
            )}
          </div>

          {isSelectMode && selectedIds.size > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleBulkSMS}
            >
              <Send className="h-4 w-4" />
              Send to {selectedIds.size}
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-550px)] min-h-[200px]">
        <div className="space-y-4">
          {/* Hot Opportunities */}
          {hotOpportunities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                <Sparkles className="h-4 w-4" />
                Hot Opportunities ({hotOpportunities.length})
              </div>
              <div className="space-y-2">
                {hotOpportunities.map(renderOpportunityCard)}
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
                {neverContactedOpportunities.map(renderOpportunityCard)}
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
                {otherOpportunities.map(renderOpportunityCard)}
              </div>
            </div>
          )}

          {/* On Cooldown - Collapsible at bottom */}
          {cooldownOpportunities.length > 0 && (
            <Collapsible open={isCooldownOpen} onOpenChange={setIsCooldownOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  On Cooldown ({cooldownOpportunities.length})
                </span>
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${
                    isCooldownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {cooldownOpportunities.map(opp => (
                  <OpportunityCard
                    key={opp.contact.id}
                    opportunity={opp}
                    onSendSMS={() => {}} // No-op for cooldown contacts
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}