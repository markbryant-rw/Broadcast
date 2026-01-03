import { format } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSMSLogs } from '@/hooks/useSMSLogs';

interface SMSLogTableProps {
  contactId?: string;
}

const triggerTypeLabels: Record<string, string> = {
  manual: 'Manual',
  nearby_sale: 'Nearby Sale',
  campaign: 'Campaign',
};

export default function SMSLogTable({ contactId }: SMSLogTableProps) {
  const { logs, isLoading } = useSMSLogs(contactId);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading SMS history...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium mb-2">No SMS history</h3>
        <p className="text-sm text-muted-foreground">
          {contactId 
            ? 'No SMS messages have been sent to this contact yet'
            : 'Start sending SMS messages to see them here'}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!contactId && <TableHead>Contact</TableHead>}
          <TableHead>Phone</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Sent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            {!contactId && (
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {log.contacts?.first_name || log.contacts?.last_name
                        ? `${log.contacts?.first_name || ''} ${log.contacts?.last_name || ''}`.trim()
                        : log.contacts?.email || 'Unknown'}
                    </p>
                  </div>
                </div>
              </TableCell>
            )}
            <TableCell className="font-mono text-sm">
              {log.phone_number}
            </TableCell>
            <TableCell>
              <p className="text-sm max-w-md truncate" title={log.message_body}>
                {log.message_body}
              </p>
              {log.trigger_property_address && (
                <p className="text-xs text-muted-foreground mt-1">
                  Re: {log.trigger_property_address}
                </p>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">
                {triggerTypeLabels[log.trigger_type || 'manual'] || log.trigger_type}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
