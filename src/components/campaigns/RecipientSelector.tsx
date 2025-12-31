import { useState, useMemo } from 'react';
import { Check, Users, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTags } from '@/hooks/useTags';
import { useContactLists } from '@/hooks/useContactLists';
import { useContacts } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';

export type RecipientSelection = {
  type: 'all' | 'lists' | 'tags' | 'manual';
  listIds?: string[];
  tagIds?: string[];
  contactIds?: string[];
};

interface RecipientSelectorProps {
  value: RecipientSelection;
  onChange: (value: RecipientSelection) => void;
}

export function RecipientSelector({ value, onChange }: RecipientSelectorProps) {
  const { tags } = useTags();
  const { lists } = useContactLists();
  const { contacts } = useContacts();

  const estimatedCount = useMemo(() => {
    switch (value.type) {
      case 'all':
        return contacts.filter(c => c.status === 'active').length;
      case 'lists':
        // This is an estimate - actual count would require a join query
        return value.listIds?.reduce((sum, listId) => {
          const list = lists.find(l => l.id === listId);
          return sum + (list?.member_count || 0);
        }, 0) || 0;
      case 'tags':
        // Estimate based on selected tags
        return value.tagIds?.length ? Math.floor(contacts.length * 0.3) : 0;
      case 'manual':
        return value.contactIds?.length || 0;
      default:
        return 0;
    }
  }, [value, contacts, lists]);

  const handleTypeChange = (type: RecipientSelection['type']) => {
    onChange({ type, listIds: [], tagIds: [], contactIds: [] });
  };

  const handleToggleList = (listId: string) => {
    const currentIds = value.listIds || [];
    const newIds = currentIds.includes(listId)
      ? currentIds.filter(id => id !== listId)
      : [...currentIds, listId];
    onChange({ ...value, type: 'lists', listIds: newIds });
  };

  const handleToggleTag = (tagId: string) => {
    const currentIds = value.tagIds || [];
    const newIds = currentIds.includes(tagId)
      ? currentIds.filter(id => id !== tagId)
      : [...currentIds, tagId];
    onChange({ ...value, type: 'tags', tagIds: newIds });
  };

  const handleToggleContact = (contactId: string) => {
    const currentIds = value.contactIds || [];
    const newIds = currentIds.includes(contactId)
      ? currentIds.filter(id => id !== contactId)
      : [...currentIds, contactId];
    onChange({ ...value, type: 'manual', contactIds: newIds });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Recipients</h3>
        <Badge variant="secondary">
          ~{estimatedCount} recipient{estimatedCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      <RadioGroup value={value.type} onValueChange={handleTypeChange}>
        <div className="space-y-3">
          {/* All Contacts */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
              <Users className="h-4 w-4" />
              All active contacts
            </Label>
          </div>

          {/* By List */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lists" id="lists" />
              <Label htmlFor="lists" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                Select by list
              </Label>
            </div>
            {value.type === 'lists' && (
              <ScrollArea className="h-32 ml-6 border rounded-md p-2">
                {lists.length > 0 ? (
                  lists.map((list) => (
                    <div
                      key={list.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded cursor-pointer",
                        value.listIds?.includes(list.id) ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => handleToggleList(list.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={value.listIds?.includes(list.id)}
                          onCheckedChange={() => handleToggleList(list.id)}
                        />
                        <span>{list.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({list.member_count})
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2">No lists created yet</p>
                )}
              </ScrollArea>
            )}
          </div>

          {/* By Tag */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tags" id="tags" />
              <Label htmlFor="tags" className="flex items-center gap-2 cursor-pointer">
                <Tag className="h-4 w-4" />
                Select by tag
              </Label>
            </div>
            {value.type === 'tags' && (
              <div className="ml-6 flex flex-wrap gap-2 p-2 border rounded-md">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={value.tagIds?.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={
                        value.tagIds?.includes(tag.id)
                          ? { backgroundColor: tag.color || '#6366f1', color: 'white' }
                          : {}
                      }
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      {tag.name}
                      {value.tagIds?.includes(tag.id) && (
                        <Check className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags created yet</p>
                )}
              </div>
            )}
          </div>

          {/* Manual Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Select individual contacts
              </Label>
            </div>
            {value.type === 'manual' && (
              <ScrollArea className="h-40 ml-6 border rounded-md p-2">
                {contacts.filter(c => c.status === 'active').map((contact) => (
                  <div
                    key={contact.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer",
                      value.contactIds?.includes(contact.id) ? "bg-primary/10" : "hover:bg-muted"
                    )}
                    onClick={() => handleToggleContact(contact.id)}
                  >
                    <Checkbox
                      checked={value.contactIds?.includes(contact.id)}
                      onCheckedChange={() => handleToggleContact(contact.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.first_name || contact.last_name
                          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                          : contact.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
