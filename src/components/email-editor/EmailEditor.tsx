import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Type,
  Heading1,
  Heading2,
  Code,
  Eye,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailEditorProps {
  initialContent?: string;
  initialSubject?: string;
  onChange?: (content: { html: string; subject: string }) => void;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}

const ToolbarButton = ({ icon, onClick, active, title }: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className={cn(
      "h-8 w-8 p-0",
      active && "bg-muted"
    )}
    onClick={onClick}
    title={title}
  >
    {icon}
  </Button>
);

export default function EmailEditor({ initialContent = '', initialSubject = '', onChange }: EmailEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.({ html: newContent, subject });
  }, [subject, onChange]);

  const handleSubjectChange = useCallback((newSubject: string) => {
    setSubject(newSubject);
    onChange?.({ html: content, subject: newSubject });
  }, [content, onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const insertTag = (tag: string, attributes?: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const element = document.createElement(tag);
      if (attributes) {
        const [attr, val] = attributes.split('=');
        element.setAttribute(attr, val.replace(/"/g, ''));
      }
      element.textContent = selectedText || 'New text';
      range.deleteContents();
      range.insertNode(element);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const generatePreviewHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            h2 { font-size: 20px; margin-bottom: 12px; }
            p { margin-bottom: 16px; }
            a { color: #6366f1; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-4">
      {/* Subject Line */}
      <div>
        <label className="text-sm font-medium mb-2 block">Subject Line</label>
        <Input
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          placeholder="Enter email subject..."
          className="text-lg"
        />
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Card>
            <CardHeader className="py-2 px-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1">
                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Bold className="h-4 w-4" />}
                    onClick={() => execCommand('bold')}
                    title="Bold"
                  />
                  <ToolbarButton
                    icon={<Italic className="h-4 w-4" />}
                    onClick={() => execCommand('italic')}
                    title="Italic"
                  />
                  <ToolbarButton
                    icon={<Underline className="h-4 w-4" />}
                    onClick={() => execCommand('underline')}
                    title="Underline"
                  />
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Heading1 className="h-4 w-4" />}
                    onClick={() => execCommand('formatBlock', 'h1')}
                    title="Heading 1"
                  />
                  <ToolbarButton
                    icon={<Heading2 className="h-4 w-4" />}
                    onClick={() => execCommand('formatBlock', 'h2')}
                    title="Heading 2"
                  />
                  <ToolbarButton
                    icon={<Type className="h-4 w-4" />}
                    onClick={() => execCommand('formatBlock', 'p')}
                    title="Paragraph"
                  />
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<AlignLeft className="h-4 w-4" />}
                    onClick={() => execCommand('justifyLeft')}
                    title="Align Left"
                  />
                  <ToolbarButton
                    icon={<AlignCenter className="h-4 w-4" />}
                    onClick={() => execCommand('justifyCenter')}
                    title="Align Center"
                  />
                  <ToolbarButton
                    icon={<AlignRight className="h-4 w-4" />}
                    onClick={() => execCommand('justifyRight')}
                    title="Align Right"
                  />
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<List className="h-4 w-4" />}
                    onClick={() => execCommand('insertUnorderedList')}
                    title="Bullet List"
                  />
                  <ToolbarButton
                    icon={<ListOrdered className="h-4 w-4" />}
                    onClick={() => execCommand('insertOrderedList')}
                    title="Numbered List"
                  />
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    icon={<Link className="h-4 w-4" />}
                    onClick={insertLink}
                    title="Insert Link"
                  />
                  <ToolbarButton
                    icon={<Image className="h-4 w-4" />}
                    onClick={insertImage}
                    title="Insert Image"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="min-h-[400px] p-4 focus:outline-none prose prose-sm max-w-none"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card>
            <CardHeader className="py-3 border-b">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">{subject || '(No subject)'}</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                srcDoc={generatePreviewHtml()}
                className="w-full min-h-[400px] border-0"
                title="Email Preview"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
