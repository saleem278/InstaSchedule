import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { usePrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, useImportExcelPrompts } from '../hooks/usePrompts';
import type { PromptTemplate } from '../schemas/prompt.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PromptsManagement(): React.JSX.Element {
  const { data: prompts = [], isLoading } = usePrompts();
  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();
  const deletePromptMutation = useDeletePrompt();
  const importExcelMutation = useImportExcelPrompts();

  const [isOpen, setIsOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [postType, setPostType] = useState<'feed' | 'story' | 'carousel'>('feed');

  const handleOpenCreate = () => {
    setEditingPrompt(null);
    setName('');
    setPromptText('');
    setPostType('feed');
    setIsOpen(true);
  };

  const handleOpenEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setName(prompt.name);
    setPromptText(prompt.promptText);
    setPostType(prompt.postType);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !promptText.trim()) return;

    const payload = {
      name: name.trim(),
      promptText: promptText.trim(),
      postType,
    };

    if (editingPrompt) {
      await updatePromptMutation.mutateAsync({
        id: editingPrompt._id,
        payload,
      });
    } else {
      await createPromptMutation.mutateAsync(payload);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt template?')) {
      await deletePromptMutation.mutateAsync(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importExcelMutation.mutate(file);
      e.target.value = '';
    }
  };

  return (
    <Card className="mt-6 border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight">Saved Prompt Templates</CardTitle>
          <CardDescription>
            Manage reusable prompts to quickly configure new posts.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="excel-import-file-input"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('excel-import-file-input')?.click()}
            disabled={importExcelMutation.isPending}
            className="h-9 gap-1.5 text-xs border-border/80"
          >
            {importExcelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-textTertiary" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
            Import Excel
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-textTertiary" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 py-8 px-4 text-center">
            <div className="rounded-full bg-backgroundMuted p-3 text-textTertiary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-textPrimary">No prompt templates</h3>
            <p className="mt-1 text-xs text-textSecondary max-w-[280px]">
              Templates let you prefill prompt configurations on the creation wizard.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {prompts.map((prompt) => (
              <div
                key={prompt._id}
                className="group relative flex flex-col justify-between rounded-lg border border-border bg-surface p-4 hover:border-textSecondary/30 hover:shadow-xs transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-textPrimary truncate pr-16" title={prompt.name}>
                      {prompt.name}
                    </h4>
                    <Badge variant="secondary" className="capitalize text-[10px] shrink-0 font-medium">
                      {prompt.postType}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-textSecondary pr-6 leading-relaxed">
                    {prompt.promptText}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenEdit(prompt)}
                    className="h-7 w-7 text-textSecondary hover:text-textPrimary"
                    title="Edit template"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(prompt._id)}
                    className="h-7 w-7 text-textSecondary hover:text-danger"
                    title="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {editingPrompt ? 'Edit Prompt Template' : 'New Prompt Template'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide a name and reusable prompt text for your template.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template-name" className="text-right text-xs font-medium">
                  Name
                </Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Developer Roadmap Carousel"
                  className="col-span-3 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template-type" className="text-right text-xs font-medium">
                  Post Type
                </Label>
                <div className="col-span-3">
                  <Select
                    value={postType}
                    onValueChange={(v) => setPostType(v as 'feed' | 'story' | 'carousel')}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed" className="text-xs">Feed (Single Image)</SelectItem>
                      <SelectItem value="story" className="text-xs">Story</SelectItem>
                      <SelectItem value="carousel" className="text-xs">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="template-prompt" className="text-right text-xs font-medium pt-2">
                  Prompt
                </Label>
                <Textarea
                  id="template-prompt"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Write the full instructions for the AI template generator here..."
                  className="col-span-3 min-h-[140px] text-xs leading-relaxed"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
              >
                {(createPromptMutation.isPending || updatePromptMutation.isPending) && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
