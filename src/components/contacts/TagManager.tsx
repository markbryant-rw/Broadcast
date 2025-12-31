import { useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTags } from '@/hooks/useTags';

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo
  '#64748b', // slate
];

interface TagManagerProps {
  selectedTagId?: string;
  onSelectTag?: (tagId: string | undefined) => void;
}

export function TagManager({ selectedTagId, onSelectTag }: TagManagerProps) {
  const { tags, addTag, updateTag, deleteTag } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    addTag.mutate({ name: newTagName.trim(), color: newTagColor });
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    updateTag.mutate({ id: editingTag.id, name: editingTag.name.trim(), color: editingTag.color });
    setEditingTag(null);
  };

  const handleDeleteTag = (id: string) => {
    if (confirm('Are you sure you want to delete this tag? It will be removed from all contacts.')) {
      deleteTag.mutate(id);
      if (selectedTagId === id) {
        onSelectTag?.(undefined);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">Tags</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Tags</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-10 h-10 p-0"
                      style={{ backgroundColor: newTagColor }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/50"
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTagColor(color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    {editingTag?.id === tag.id ? (
                      <div className="flex gap-2 flex-1 mr-2">
                        <Input
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="h-8"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-8 h-8 p-0"
                              style={{ backgroundColor: editingTag.color }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-5 gap-1">
                              {TAG_COLORS.map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/50"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditingTag({ ...editingTag, color })}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button size="sm" onClick={handleUpdateTag}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTag(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: tag.color || '#6366f1', color: 'white' }}
                        >
                          {tag.name}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingTag({ id: tag.id, name: tag.name, color: tag.color || '#6366f1' })}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleDeleteTag(tag.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tags yet. Create your first tag above.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedTagId === undefined ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onSelectTag?.(undefined)}
        >
          All
        </Badge>
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTagId === tag.id ? 'default' : 'outline'}
            className="cursor-pointer"
            style={selectedTagId === tag.id ? { backgroundColor: tag.color || '#6366f1', color: 'white' } : {}}
            onClick={() => onSelectTag?.(tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
