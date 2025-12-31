import { useState } from 'react';
import { Plus, MoreVertical, Users, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContactLists, ContactListWithCount } from '@/hooks/useContactLists';
import { cn } from '@/lib/utils';

interface ContactListsPanelProps {
  selectedListId?: string;
  onSelectList?: (listId: string | undefined) => void;
}

export function ContactListsPanel({ selectedListId, onSelectList }: ContactListsPanelProps) {
  const { lists, addList, updateList, deleteList } = useContactLists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingList, setEditingList] = useState<ContactListWithCount | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    addList.mutate({ name: newListName.trim(), description: newListDescription.trim() || null });
    setNewListName('');
    setNewListDescription('');
    setIsCreateOpen(false);
  };

  const handleUpdateList = () => {
    if (!editingList || !editingList.name.trim()) return;
    updateList.mutate({ 
      id: editingList.id, 
      name: editingList.name.trim(), 
      description: editingList.description?.trim() || null 
    });
    setEditingList(null);
    setIsEditOpen(false);
  };

  const handleDeleteList = (list: ContactListWithCount) => {
    if (confirm(`Are you sure you want to delete "${list.name}"? Contacts will not be deleted.`)) {
      deleteList.mutate(list.id);
      if (selectedListId === list.id) {
        onSelectList?.(undefined);
      }
    }
  };

  const handleEditClick = (list: ContactListWithCount) => {
    setEditingList(list);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">Lists</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="List name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                  Create List
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
            selectedListId === undefined 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
          onClick={() => onSelectList?.(undefined)}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>All Contacts</span>
          </div>
        </button>

        {lists.map((list) => (
          <div
            key={list.id}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors group",
              selectedListId === list.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            <button
              className="flex-1 flex items-center gap-2 text-left"
              onClick={() => onSelectList?.(list.id)}
            >
              <Users className="h-4 w-4" />
              <span className="truncate">{list.name}</span>
              <span className={cn(
                "text-xs",
                selectedListId === list.id ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                ({list.member_count})
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 opacity-0 group-hover:opacity-100",
                    selectedListId === list.id && "opacity-100"
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => handleEditClick(list)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleDeleteList(list)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {lists.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No lists yet. Create your first list.
          </p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          {editingList && (
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="List name"
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={editingList.description || ''}
                  onChange={(e) => setEditingList({ ...editingList, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateList} disabled={!editingList.name.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
