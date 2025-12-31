import { useState } from "react";
import { Plus, Copy, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTemplates, EmailTemplate, DEFAULT_TEMPLATES } from "@/hooks/useTemplates";
import { toast } from "sonner";

interface TemplateLibraryProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  mode?: 'manage' | 'select';
}

export function TemplateLibrary({ onSelectTemplate, mode = 'manage' }: TemplateLibraryProps) {
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDefaultTemplate, setSelectedDefaultTemplate] = useState<typeof DEFAULT_TEMPLATES[0] | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");

  const { templates, isLoading, createTemplate, deleteTemplate } = useTemplates();

  const handleSaveDefaultTemplate = async () => {
    if (!selectedDefaultTemplate || !newTemplateName) return;

    await createTemplate.mutateAsync({
      name: newTemplateName,
      subject: selectedDefaultTemplate.subject,
      content: selectedDefaultTemplate.content,
      html: selectedDefaultTemplate.html,
    });

    setNewTemplateName("");
    setSelectedDefaultTemplate(null);
    setShowSaveDialog(false);
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const handleCopyDefault = (template: typeof DEFAULT_TEMPLATES[0]) => {
    setSelectedDefaultTemplate(template);
    setNewTemplateName(`${template.name} - Copy`);
    setShowSaveDialog(true);
  };

  return (
    <div className="space-y-8">
      {/* Pre-designed Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pre-designed Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_TEMPLATES.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.category}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div 
                  className="aspect-[4/3] rounded-md border bg-muted overflow-hidden cursor-pointer"
                  onClick={() => setShowPreview(template as unknown as EmailTemplate)}
                >
                  <div 
                    className="w-full h-full scale-[0.25] origin-top-left"
                    style={{ width: '400%', height: '400%' }}
                    dangerouslySetInnerHTML={{ __html: template.html }}
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPreview(template as unknown as EmailTemplate)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyDefault(template)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Use
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* User's Saved Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Templates</h3>
        {isLoading ? (
          <p className="text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No saved templates yet. Copy a pre-designed template or create one in the campaign editor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.is_default && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {template.subject || "No subject"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div 
                    className="aspect-[4/3] rounded-md border bg-muted overflow-hidden cursor-pointer"
                    onClick={() => setShowPreview(template)}
                  >
                    {template.html ? (
                      <div 
                        className="w-full h-full scale-[0.25] origin-top-left"
                        style={{ width: '400%', height: '400%' }}
                        dangerouslySetInnerHTML={{ __html: template.html }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No preview available
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  {mode === 'select' ? (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowPreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{showPreview?.name}</DialogTitle>
            <DialogDescription>{showPreview?.subject}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-white">
            {showPreview?.html && (
              <div dangerouslySetInnerHTML={{ __html: showPreview.html }} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(null)}>
              Close
            </Button>
            {mode === 'select' && showPreview && (
              <Button onClick={() => {
                handleUseTemplate(showPreview);
                setShowPreview(null);
              }}>
                Use Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Default Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Save this template to your library for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="My Template"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDefaultTemplate}
              disabled={!newTemplateName || createTemplate.isPending}
            >
              {createTemplate.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
