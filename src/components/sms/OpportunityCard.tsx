import { MessageSquare, MapPin, Clock, Sparkles, Star, Timer, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Opportunity, ActionStatus } from '@/hooks/useOpportunities';
import { useRecordContactAction, useUndoContactAction } from '@/hooks/useSaleContactActions';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
  saleId: string;
  onSendSMS: () => void;
  hideButton?: boolean;
}

function formatDistance(meters: number | null): string {
  if (meters === null) return '';
  if (meters < 1000) return `~${Math.round(meters)}m away`;
  return `~${(meters / 1000).toFixed(1)}km away`;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
}

function getContactStatus(opportunity: Opportunity): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} {
  if (opportunity.isOnCooldown && opportunity.cooldownDaysRemaining !== null) {
    return {
      label: `${opportunity.cooldownDaysRemaining}d cooldown`,
      variant: 'outline',
      className: 'text-muted-foreground border-muted-foreground/30',
    };
  }
  
  if (opportunity.neverContacted) {
    return {
      label: 'NEVER CONTACTED',
      variant: 'default',
      className: 'bg-warning text-warning-foreground animate-pulse',
    };
  }
  if (opportunity.daysSinceContact !== null && opportunity.daysSinceContact > 30) {
    return {
      label: `${opportunity.daysSinceContact}+ days ago`,
      variant: 'secondary',
    };
  }
  if (opportunity.daysSinceContact !== null) {
    return {
      label: `${opportunity.daysSinceContact} days ago`,
      variant: 'outline',
    };
  }
  return { label: '', variant: 'outline' };
}

export default function OpportunityCard({ opportunity, saleId, onSendSMS, hideButton = false }: OpportunityCardProps) {
  const { contact, isOnCooldown, actionStatus } = opportunity;
  const status = getContactStatus(opportunity);
  const hasPhone = !!contact.phone;
  const isDisabled = !hasPhone || isOnCooldown;
  const isIgnored = actionStatus === 'ignored';
  const isContacted = actionStatus === 'contacted';
  
  const recordAction = useRecordContactAction();
  const undoAction = useUndoContactAction();

  const handleMarkContacted = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordAction.mutate({
      saleId,
      contactId: contact.id,
      action: 'contacted',
    });
  };

  const handleIgnore = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordAction.mutate({
      saleId,
      contactId: contact.id,
      action: 'ignored',
    });
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    undoAction.mutate({
      saleId,
      contactId: contact.id,
    });
  };

  // Ignored state - show greyed out with undo button
  if (isIgnored) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 opacity-60">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground">
            {getInitials(contact.first_name, contact.last_name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-muted-foreground line-through">
              {contact.first_name || 'Unknown'} {contact.last_name || ''}
            </span>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Ignored
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
            {contact.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{contact.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* Undo Button */}
        {!hideButton && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleUndo}
            disabled={undoAction.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </Button>
        )}
      </div>
    );
  }

  // Contacted state - show with checkmark
  if (isContacted) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-success/5 border-success/20">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-success/10 text-success">
            {getInitials(contact.first_name, contact.last_name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {contact.first_name || 'Unknown'} {contact.last_name || ''}
            </span>
            <Badge className="text-xs bg-success text-success-foreground gap-1">
              <Check className="h-2.5 w-2.5" />
              Contacted
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {contact.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{contact.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* Undo Button */}
        {!hideButton && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleUndo}
            disabled={undoAction.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
        isOnCooldown 
          ? "opacity-50 bg-muted/30" 
          : "hover:bg-accent/5"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className={cn(
          "font-medium",
          isOnCooldown 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary/10 text-primary"
        )}>
          {getInitials(contact.first_name, contact.last_name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            isOnCooldown && "text-muted-foreground"
          )}>
            {contact.first_name || 'Unknown'} {contact.last_name || ''}
          </span>
          {opportunity.sameStreet && !isOnCooldown && (
            <Badge variant="outline" className="shrink-0 text-xs gap-1">
              <Star className="h-2.5 w-2.5 fill-current" />
              Same Street
            </Badge>
          )}
        </div>

        <div className={cn(
          "flex flex-wrap items-center gap-2 text-xs",
          isOnCooldown ? "text-muted-foreground/60" : "text-muted-foreground"
        )}>
          {contact.address && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.address}</span>
            </span>
          )}
          {opportunity.distance !== null && (
            <span className="shrink-0">• {formatDistance(opportunity.distance)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status.label && (
            <Badge variant={status.variant} className={`text-xs ${status.className || ''}`}>
              {isOnCooldown ? (
                <Timer className="h-2.5 w-2.5 mr-1" />
              ) : (
                <Clock className="h-2.5 w-2.5 mr-1" />
              )}
              {status.label}
            </Badge>
          )}
          {opportunity.neverContacted && opportunity.sameStreet && !isOnCooldown && (
            <Badge className="bg-success text-success-foreground text-xs gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              HOT
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!hideButton && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Ignore Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleIgnore}
            disabled={recordAction.isPending}
            title="Ignore this contact for this sale"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Mark Contacted Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10"
            onClick={handleMarkContacted}
            disabled={recordAction.isPending}
            title="Mark as contacted (without sending SMS)"
          >
            <Check className="h-4 w-4" />
          </Button>

          {/* Send SMS Button */}
          <Button
            size="sm"
            className={cn(
              "gap-1.5",
              isOnCooldown 
                ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed" 
                : "bg-success hover:bg-success/90 text-success-foreground"
            )}
            onClick={e => {
              e.stopPropagation();
              if (!isDisabled) onSendSMS();
            }}
            disabled={isDisabled}
            title={
              isOnCooldown 
                ? `On cooldown for ${opportunity.cooldownDaysRemaining} more days`
                : hasPhone 
                  ? 'Send SMS' 
                  : 'No phone number'
            }
          >
            {isOnCooldown ? (
              <>
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">{opportunity.cooldownDaysRemaining}d</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">SMS</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
