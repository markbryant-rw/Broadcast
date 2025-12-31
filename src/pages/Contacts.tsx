import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Upload, Loader2 } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import ContactsTable from '@/components/contacts/ContactsTable';
import AddContactDialog from '@/components/contacts/AddContactDialog';
import { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;

export default function Contacts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useContacts();

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(query) ||
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query)
    );
  });

  const handleAddContact = async (data: { email: string; first_name?: string; last_name?: string }) => {
    await addContact.mutateAsync(data);
  };

  const handleDelete = (id: string) => {
    deleteContact.mutate(id);
  };

  const handleUpdateStatus = (id: string, status: Contact['status']) => {
    updateContact.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Contacts</h1>
            <p className="text-muted-foreground mt-1">
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

        {contacts.length > 0 ? (
          <>
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Table */}
            {filteredContacts.length > 0 ? (
              <ContactsTable
                contacts={filteredContacts}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No contacts match your search.</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold">No contacts yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Add contacts manually, import from a CSV, or connect AgentBuddy to sync your customers automatically.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button className="gradient-primary" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddContact}
      />
    </DashboardLayout>
  );
}
