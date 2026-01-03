import { useState } from 'react';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSMSTemplates, SMSTemplate } from '@/hooks/useSMSTemplates';

const CATEGORIES = [
  { value: 'nearby_sale', label: 'Nearby Sale' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'market_update', label: 'Market Update' },
  { value: 'general', label: 'General' },
];

interface TemplateFormData {
  name: string;
  body: string;
  category: string;
}

export default function SMSTemplateManager() {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useSMSTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    body: '',
    category: 'general',
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', body: '', category: 'general' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      body: template.body,
      category: template.category || 'general',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      await addTemplate.mutateAsync({
        ...formData,
        organization_id: null,
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">SMS Templates</h2>
          <p className="text-sm text-muted-foreground">
            Create reusable message templates with merge fields
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No templates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first SMS template to speed up messaging
            </p>
            <Button onClick={handleOpenCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.body}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {template.body.length} characters
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Use merge fields like {'{{first_name}}'} to personalize messages
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Nearby Sale Alert"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Message</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.body.length}/160 characters
                </span>
              </div>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Hi {{first_name}}, a property near you just sold..."
                className="min-h-[120px]"
                required
              />
              <div className="flex flex-wrap gap-1">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setFormData(prev => ({ ...prev, body: prev.body + '{{first_name}}' }))}
                >
                  {'{{first_name}}'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setFormData(prev => ({ ...prev, body: prev.body + '{{last_name}}' }))}
                >
                  {'{{last_name}}'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setFormData(prev => ({ ...prev, body: prev.body + '{{address}}' }))}
                >
                  {'{{address}}'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted text-primary border-primary/50"
                  onClick={() => setFormData(prev => ({ ...prev, body: prev.body + '{{sale_address}}' }))}
                >
                  {'{{sale_address}}'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted text-primary border-primary/50"
                  onClick={() => setFormData(prev => ({ ...prev, body: prev.body + '{{sale_price}}' }))}
                >
                  {'{{sale_price}}'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary">
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
