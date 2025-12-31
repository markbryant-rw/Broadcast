import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Tag as TagIcon } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type Contact = Tables<'contacts'>;
type Tag = Tables<'tags'>;

interface ContactsTableProps {
  contacts: Contact[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: 'active' | 'archived') => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unsubscribed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  bounced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  archived: 'bg-muted text-muted-foreground',
};

export default function ContactsTable({ 
  contacts, 
  onDelete, 
  onUpdateStatus,
  selectedIds = [],
  onSelectionChange,
}: ContactsTableProps) {
  const [contactTags, setContactTags] = useState<Record<string, Tag[]>>({});

  useEffect(() => {
    const fetchTags = async () => {
      if (contacts.length === 0) return;
      const contactIds = contacts.map(c => c.id);
      const { data } = await supabase
        .from('contact_tags')
        .select('contact_id, tags(*)')
        .in('contact_id', contactIds);

      const tagsMap: Record<string, Tag[]> = {};
      data?.forEach((item: any) => {
        if (!tagsMap[item.contact_id]) tagsMap[item.contact_id] = [];
        if (item.tags) tagsMap[item.contact_id].push(item.tags);
      });
      setContactTags(tagsMap);
    };
    fetchTags();
  }, [contacts]);

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange?.(checked ? contacts.map(c => c.id) : []);
  };

  const handleSelectOne = (contactId: string, checked: boolean) => {
    onSelectionChange?.(checked 
      ? [...selectedIds, contactId] 
      : selectedIds.filter(id => id !== contactId));
  };

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            {onSelectionChange && (
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(contact.id)}
                  onCheckedChange={(checked) => handleSelectOne(contact.id, !!checked)}
                />
              </TableCell>
            )}
            <TableCell className="font-medium">
              {contact.first_name || contact.last_name
                ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                : '-'}
            </TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1 max-w-48">
                {contactTags[contact.id]?.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: tag.color || '#6366f1', color: 'white' }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {(contactTags[contact.id]?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(contactTags[contact.id]?.length || 0) - 3}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className={statusColors[contact.status]}>
                {contact.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(contact.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => onUpdateStatus(contact.id, 'active')}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(contact.id, 'archived')}>
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(contact.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}