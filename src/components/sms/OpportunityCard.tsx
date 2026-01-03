import { MessageSquare, MapPin, Clock, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Opportunity } from '@/hooks/useOpportunities';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSendSMS: () => void;
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

export default function OpportunityCard({ opportunity, onSendSMS }: OpportunityCardProps) {
  const { contact } = opportunity;
  const status = getContactStatus(opportunity);
  const hasPhone = !!contact.phone;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(contact.first_name, contact.last_name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {contact.first_name || 'Unknown'} {contact.last_name || ''}
          </span>
          {opportunity.sameStreet && (
            <Badge variant="outline" className="shrink-0 text-xs gap-1">
              <Star className="h-2.5 w-2.5 fill-current" />
              Same Street
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
              <Clock className="h-2.5 w-2.5 mr-1" />
              {status.label}
            </Badge>
          )}
          {opportunity.neverContacted && opportunity.sameStreet && (
            <Badge className="bg-success text-success-foreground text-xs gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              HOT
            </Badge>
          )}
        </div>
      </div>

      {/* Send Button */}
      <Button
        size="sm"
        className="shrink-0 gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
        onClick={e => {
          e.stopPropagation();
          onSendSMS();
        }}
        disabled={!hasPhone}
        title={hasPhone ? 'Send SMS' : 'No phone number'}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Send SMS</span>
      </Button>
    </div>
  );
}
