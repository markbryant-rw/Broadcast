import { useState } from 'react';
import { Check, Plus, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';
import { useContactLists } from '@/hooks/useContactLists';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddToSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContactIds: string[];
  onComplete?: () => void;
}

export function AddToSegmentDialog({
  open,
  onOpenChange,
  selectedContactIds,
  onComplete,
}: AddToSegmentDialogProps) {
  const { tags, addTag, assignTagToContact } = useTags();
  const { lists, addList, addContactsToList } = useContactLists();
  const [newTagName, setNewTagName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleToggleList = (listId: string) => {
    setSelectedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    addTag.mutate({ name: newTagName.trim() });
    setNewTagName('');
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    addList.mutate({ name: newListName.trim() });
    setNewListName('');
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      // Assign tags to all selected contacts
      for (const contactId of selectedContactIds) {
        for (const tagId of selectedTags) {
          await assignTagToContact.mutateAsync({ contactId, tagId });
        }
      }

      // Add contacts to selected lists
      for (const listId of selectedLists) {
        await addContactsToList.mutateAsync({ contactIds: selectedContactIds, listId });
      }

      toast.success(`Updated ${selectedContactIds.length} contact(s)`);
      onComplete?.();
      onOpenChange(false);
      setSelectedTags([]);
      setSelectedLists([]);
    } catch (error) {
      toast.error('Failed to update contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCount = selectedContactIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {contactCount} contact{contactCount !== 1 ? 's' : ''} to...
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tags" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="lists" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md transition-colors",
                    selectedTags.includes(tag.id) ? "bg-primary/10" : "hover:bg-muted"
                  )}
                  onClick={() => handleToggleTag(tag.id)}
                >
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: tag.color || '#6366f1', color: 'white' }}
                  >
                    {tag.name}
                  </Badge>
                  {selectedTags.includes(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags yet. Create one above.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New list name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              />
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lists.map((list) => (
                <button
                  key={list.id}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md transition-colors",
                    selectedLists.includes(list.id) ? "bg-primary/10" : "hover:bg-muted"
                  )}
                  onClick={() => handleToggleList(list.id)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{list.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({list.member_count})
                    </span>
                  </div>
                  {selectedLists.includes(list.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
              {lists.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No lists yet. Create one above.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSubmitting || (selectedTags.length === 0 && selectedLists.length === 0)}
          >
            {isSubmitting ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
