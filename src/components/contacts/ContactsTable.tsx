import { Tables } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Archive, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

type Contact = Tables<'contacts'>;

interface ContactsTableProps {
  contacts: Contact[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Contact['status']) => void;
}

const statusColors: Record<Contact['status'], string> = {
  active: 'bg-success/10 text-success border-success/20',
  unsubscribed: 'bg-muted text-muted-foreground border-muted',
  bounced: 'bg-destructive/10 text-destructive border-destructive/20',
  archived: 'bg-muted text-muted-foreground border-muted',
};

export default function ContactsTable({ contacts, onDelete, onUpdateStatus }: ContactsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Added</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/30">
              <TableCell>
                <div>
                  <p className="font-medium">
                    {contact.first_name || contact.last_name
                      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                      : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[contact.status]}>
                  {contact.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(contact.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {contact.status !== 'active' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus(contact.id, 'active')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Mark Active
                      </DropdownMenuItem>
                    )}
                    {contact.status !== 'archived' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus(contact.id, 'archived')}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(contact.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
