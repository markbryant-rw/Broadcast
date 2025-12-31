import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, FileEdit, Send, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

type Campaign = Tables<'campaigns'>;

interface CampaignsListProps {
  campaigns: Campaign[];
  onDelete: (id: string) => void;
}

const statusConfig: Record<Campaign['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-muted' },
  scheduled: { label: 'Scheduled', className: 'bg-warning/10 text-warning border-warning/20' },
  sending: { label: 'Sending', className: 'bg-primary/10 text-primary border-primary/20' },
  sent: { label: 'Sent', className: 'bg-success/10 text-success border-success/20' },
  paused: { label: 'Paused', className: 'bg-muted text-muted-foreground border-muted' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function CampaignsList({ campaigns, onDelete }: CampaignsListProps) {
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const status = statusConfig[campaign.status];
        return (
          <Card key={campaign.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold truncate">{campaign.name}</h3>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                  {campaign.subject && (
                    <p className="text-sm text-muted-foreground truncate">
                      Subject: {campaign.subject}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                    {campaign.sent_at && (
                      <> · Sent {format(new Date(campaign.sent_at), 'MMM d, yyyy')}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <Button size="sm" variant="outline">
                      <FileEdit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {campaign.status === 'sent' && (
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {campaign.status === 'draft' && (
                        <>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Clock className="mr-2 h-4 w-4" />
                            Schedule
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(campaign.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
