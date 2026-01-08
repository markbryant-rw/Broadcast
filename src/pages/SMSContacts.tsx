import { useState, useMemo } from 'react';
import { TABLES } from '@/lib/constants/tables';
import { Search, Tag, Users, Trash2, Plus, Upload } from 'lucide-react';
import SMSLayout from '@/components/layout/SMSLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ContactsTable from '@/components/contacts/ContactsTable';
import AddContactDialog from '@/components/contacts/AddContactDialog';
import { TagManager } from '@/components/contacts/TagManager';
import { ContactListsPanel } from '@/components/contacts/ContactListsPanel';
import { AddToSegmentDialog } from '@/components/contacts/AddToSegmentDialog';
import { useContacts } from '@/hooks/useContacts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function SMSContacts() {
  const { contacts, isLoading, updateContact, deleteContact, addContact } = useContacts();
  const [search, setSearch] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
  const [selectedListId, setSelectedListId] = useState<string | undefined>();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: contactIdsByTag } = useQuery({
    queryKey: ['contact_ids_by_tag', selectedTagId],
    queryFn: async () => {
      if (!selectedTagId) return null;
      const { data } = await supabase.from(TABLES.CONTACT_TAGS).select('contact_id').eq('tag_id', selectedTagId);
      return data?.map(d => d.contact_id) || [];
    },
    enabled: !!selectedTagId,
  });

  const { data: contactIdsByList } = useQuery({
    queryKey: ['contact_ids_by_list', selectedListId],
    queryFn: async () => {
      if (!selectedListId) return null;
      const { data } = await supabase.from(TABLES.CONTACT_LIST_MEMBERS).select('contact_id').eq('list_id', selectedListId);
      return data?.map(d => d.contact_id) || [];
    },
    enabled: !!selectedListId,
  });

  const filteredContacts = useMemo(() => {
    let result = contacts;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => 
        c.email.toLowerCase().includes(s) || 
        c.first_name?.toLowerCase().includes(s) || 
        c.last_name?.toLowerCase().includes(s) ||
        c.phone?.includes(s)
      );
    }
    if (selectedTagId && contactIdsByTag) {
      result = result.filter(c => contactIdsByTag.includes(c.id));
    }
    if (selectedListId && contactIdsByList) {
      result = result.filter(c => contactIdsByList.includes(c.id));
    }
    return result;
  }, [contacts, search, selectedTagId, selectedListId, contactIdsByTag, contactIdsByList]);

  const handleUpdateStatus = (id: string, status: 'active' | 'archived') => {
    updateContact.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this contact?')) {
      deleteContact.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedContactIds.length && confirm(`Delete ${selectedContactIds.length} contact(s)?`)) {
      selectedContactIds.forEach(id => deleteContact.mutate(id));
      setSelectedContactIds([]);
    }
  };

  const handleAddContact = async (data: { email: string; first_name?: string; last_name?: string }) => {
    await addContact.mutateAsync(data);
  };

  return (
    <SMSLayout>
      <div className="flex h-full">
        {/* Sidebar for Tags & Lists */}
        <div className="w-64 border-r p-4 space-y-6 hidden lg:block">
          <TagManager 
            selectedTagId={selectedTagId} 
            onSelectTag={(id) => {
              setSelectedTagId(id);
              setSelectedListId(undefined);
            }} 
          />
          <div className="border-t pt-4">
            <ContactListsPanel 
              selectedListId={selectedListId}
              onSelectList={(id) => {
                setSelectedListId(id);
                setSelectedTagId(undefined);
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Contacts</h1>
              <p className="text-muted-foreground">
                {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} in your list
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button className="gradient-primary" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Search and bulk actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedContactIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedContactIds.length} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setIsSegmentDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-1" />
                  Add to...
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Mobile filters */}
          <div className="lg:hidden space-y-4">
            <TagManager 
              selectedTagId={selectedTagId} 
              onSelectTag={(id) => {
                setSelectedTagId(id);
                setSelectedListId(undefined);
              }} 
            />
            <ContactListsPanel 
              selectedListId={selectedListId}
              onSelectList={(id) => {
                setSelectedListId(id);
                setSelectedTagId(undefined);
              }}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">
                  {search || selectedTagId || selectedListId ? 'No contacts found' : 'No contacts yet'}
                </h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {search || selectedTagId || selectedListId
                    ? 'Try adjusting your search or filters'
                    : 'Add contacts manually or import from a CSV file'}
                </p>
                {!search && !selectedTagId && !selectedListId && (
                  <Button className="mt-4 gradient-primary" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <ContactsTable
                contacts={filteredContacts}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
                selectedIds={selectedContactIds}
                onSelectionChange={setSelectedContactIds}
              />
            </div>
          )}
        </div>
      </div>

      <AddToSegmentDialog
        open={isSegmentDialogOpen}
        onOpenChange={setIsSegmentDialogOpen}
        selectedContactIds={selectedContactIds}
        onComplete={() => setSelectedContactIds([])}
      />

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddContact}
      />
    </SMSLayout>
  );
}
