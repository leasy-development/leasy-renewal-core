import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

const PROMPT_TYPES = [
  { value: 'description', label: 'Property Description' },
  { value: 'title', label: 'Property Title' },
  { value: 'alt_text', label: 'Image Alt Text' },
  { value: 'translation', label: 'Translation' },
  { value: 'summary', label: 'Property Summary' },
  { value: 'tags', label: 'Property Tags' },
  { value: 'validation', label: 'Content Validation' },
];

interface PromptVersion {
  id: string;
  prompt: string;
  created_at: string;
  version_number: number;
}

export default function AdminPromptManager() {
  const [type, setType] = useState('description');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);

  useEffect(() => {
    loadPrompt(type);
  }, [type]);

  const loadPrompt = async (selectedType: string) => {
    setLoading(true);
    try {
      // Get current active prompt for this type
      const { data: promptData, error: promptError } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('type', selectedType)
        .eq('is_active', true)
        .maybeSingle();

      if (promptError && promptError.code !== 'PGRST116') {
        throw promptError;
      }

      setPrompt(promptData?.prompt || '');

      // Get version history if prompt exists
      if (promptData) {
        const { data: versionData, error: versionError } = await supabase
          .from('ai_prompt_versions')
          .select('*')
          .eq('prompt_id', promptData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (versionError) {
          console.warn('Error loading versions:', versionError);
          setVersions([]);
        } else {
          setVersions(versionData || []);
        }
      } else {
        setVersions([]);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
      setPrompt('');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setSaving(true);
    try {
      // Check if prompt already exists for this type
      const { data: existingPrompt, error: checkError } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPrompt) {
        // Update existing prompt
        const { error: updateError } = await supabase
          .from('ai_prompts')
          .update({
            prompt: prompt.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPrompt.id);

        if (updateError) throw updateError;

        // Create version history
        const { error: versionError } = await supabase
          .from('ai_prompt_versions')
          .insert({
            prompt_id: existingPrompt.id,
            prompt: prompt.trim(),
            version_number: Date.now(),
          });

        if (versionError) {
          console.warn('Failed to create version history:', versionError);
        }
      } else {
        // Create new prompt
        const typeLabel = PROMPT_TYPES.find(t => t.value === type)?.label || type;
        const { data: newPrompt, error: insertError } = await supabase
          .from('ai_prompts')
          .insert({
            name: `${typeLabel} Prompt`,
            type: type,
            prompt: prompt.trim(),
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create initial version
        const { error: versionError } = await supabase
          .from('ai_prompt_versions')
          .insert({
            prompt_id: newPrompt.id,
            prompt: prompt.trim(),
            version_number: Date.now(),
          });

        if (versionError) {
          console.warn('Failed to create version history:', versionError);
        }
      }

      await loadPrompt(type);
      toast.success('Prompt saved and versioned successfully');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading prompt...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Edit AI Prompt</CardTitle>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {PROMPT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[180px] font-mono"
          placeholder={`Enter the system prompt for ${PROMPT_TYPES.find(t => t.value === type)?.label || type}...`}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {prompt.length} characters
          </span>
          <Button onClick={savePrompt} disabled={saving}>
            {saving ? 'Saving...' : 'Save Prompt'}
          </Button>
        </div>

        {versions?.length > 0 && (
          <div className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Prompt Version History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="border rounded p-3 text-sm bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Version {v.version_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed">
                    {v.prompt}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}