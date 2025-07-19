import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Save, History, AlertCircle } from 'lucide-react';

interface AIPrompt {
  id: string;
  name: string;
  type: string;
  prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

const PROMPT_TYPES = [
  { value: 'description', label: 'Property Description' },
  { value: 'title', label: 'Property Title' },
  { value: 'alt_text', label: 'Image Alt Text' },
  { value: 'translation', label: 'Translation' },
  { value: 'summary', label: 'Property Summary' },
  { value: 'tags', label: 'Property Tags' },
  { value: 'validation', label: 'Content Validation' },
];

const DEFAULT_PROMPTS = {
  description: `You are a professional real estate copywriter specializing in premium property listings. Write compelling, accurate descriptions that highlight unique selling points while maintaining authenticity.

Key requirements:
- Highlight unique selling points and premium features
- Create emotional connection while staying factual
- Format as clean HTML or Markdown as requested
- Keep it concise, around 500 characters maximum
- Focus on lifestyle benefits and location advantages
- Use persuasive but honest language
- Incorporate provided features naturally into the description`,

  title: `You are an expert real estate copywriter. Create compelling, SEO-optimized property titles that are concise yet descriptive. Focus on location, property type, and key selling points. Keep titles under 60 characters and include key selling points.`,

  alt_text: `You are an accessibility expert specializing in image alt text for real estate. Create concise, descriptive alt text that helps visually impaired users understand property images while being SEO-friendly. Maximum 120 characters.`,
};

export default function AdminPromptManager() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    prompt: '',
    is_active: true,
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: AIPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      name: prompt.name,
      type: prompt.type,
      prompt: prompt.prompt,
      is_active: prompt.is_active,
    });
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedPrompt(null);
    setFormData({
      name: '',
      type: '',
      prompt: '',
      is_active: true,
    });
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      prompt: prev.prompt || DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS] || '',
    }));
  };

  const savePrompt = async () => {
    if (!formData.name.trim() || !formData.type || !formData.prompt.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        // Create new prompt
        const { error } = await supabase
          .from('ai_prompts')
          .insert({
            name: formData.name.trim(),
            type: formData.type,
            prompt: formData.prompt.trim(),
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Prompt created successfully');
      } else if (selectedPrompt) {
        // Update existing prompt
        const { error: updateError } = await supabase
          .from('ai_prompts')
          .update({
            name: formData.name.trim(),
            prompt: formData.prompt.trim(),
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedPrompt.id);

        if (updateError) throw updateError;

        // Create version history
        const { error: versionError } = await supabase
          .from('ai_prompt_versions')
          .insert({
            prompt_id: selectedPrompt.id,
            prompt: formData.prompt.trim(),
            version_number: Math.floor(Date.now() / 1000), // Simple version numbering
          });

        if (versionError) console.warn('Failed to create version history:', versionError);
        
        toast.success('Prompt updated successfully');
      }

      await loadPrompts();
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const togglePromptStatus = async (prompt: AIPrompt) => {
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({ is_active: !prompt.is_active })
        .eq('id', prompt.id);

      if (error) throw error;
      
      await loadPrompts();
      toast.success(`Prompt ${!prompt.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling prompt status:', error);
      toast.error('Failed to update prompt status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Prompt Management</h1>
          <p className="text-muted-foreground">Manage system prompts for AI content generation</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Existing Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prompts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No prompts found</p>
            ) : (
              prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPrompt?.id === prompt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate">{prompt.name}</h3>
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PROMPT_TYPES.find(t => t.value === prompt.type)?.label || prompt.type}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(prompt.updated_at).toLocaleDateString()}
                    </span>
                    <Switch
                      checked={prompt.is_active}
                      onCheckedChange={() => togglePromptStatus(prompt)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              {isCreating ? 'Create New Prompt' : selectedPrompt ? 'Edit Prompt' : 'Select a Prompt'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isCreating || selectedPrompt) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Prompt Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter prompt name"
                      disabled={!isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Prompt Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={handleTypeChange}
                      disabled={!isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select prompt type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active prompt</Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="prompt">System Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Enter the system prompt for AI generation..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.prompt.length} characters
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={savePrompt} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Prompt'}
                  </Button>
                  {!isCreating && (
                    <Button variant="outline" onClick={handleCreateNew}>
                      Create New
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Prompt Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select an existing prompt from the list or create a new one to get started.
                </p>
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Prompt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}