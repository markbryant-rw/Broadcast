import { useState } from 'react';
import { Search, User, Phone, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useContacts } from '@/hooks/useContacts';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address?: string | null;
  address_suburb?: string | null;
}

interface ContactSMSListProps {
  selectedContactId: string | null;
  onSelectContact: (contact: Contact) => void;
}

export default function ContactSMSList({ selectedContactId, onSelectContact }: ContactSMSListProps) {
  const { contacts, isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts and cast to include new fields
  const filteredContacts = (contacts as Contact[]).filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const email = contact.email.toLowerCase();
    const phone = contact.phone?.toLowerCase() || '';
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           phone.includes(searchLower);
  });

  // Separate contacts with and without phone numbers
  const contactsWithPhone = filteredContacts.filter(c => c.phone);
  const contactsWithoutPhone = filteredContacts.filter(c => !c.phone);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contact list */}
      <ScrollArea className="flex-1">
        {contactsWithPhone.length === 0 && contactsWithoutPhone.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="p-2">
            {/* Contacts with phone */}
            {contactsWithPhone.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  With Phone ({contactsWithPhone.length})
                </p>
                {contactsWithPhone.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onClick={() => onSelectContact(contact)}
                  />
                ))}
              </div>
            )}

            {/* Contacts without phone */}
            {contactsWithoutPhone.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  No Phone ({contactsWithoutPhone.length})
                </p>
                {contactsWithoutPhone.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onClick={() => onSelectContact(contact)}
                    disabled
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ContactItem({ contact, isSelected, onClick, disabled }: ContactItemProps) {
  const name = contact.first_name || contact.last_name 
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : contact.email;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
        isSelected 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        {contact.phone ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{contact.phone}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60">No phone number</p>
        )}
        {contact.address_suburb && (
          <Badge variant="outline" className="text-xs mt-1">
            {contact.address_suburb}
          </Badge>
        )}
      </div>
    </button>
  );
}
