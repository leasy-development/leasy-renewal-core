import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpdateBroadcastPanel } from '@/components/admin/UpdateBroadcastPanel';
import { 
  Save, 
  History, 
  TestTube, 
  RotateCcw, 
  Settings, 
  Brain,
  Clock,
  User,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AIPrompt {
  id: string;
  type: string;
  name: string;
  prompt: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

interface PromptVersion {
  id: string;
  prompt_id: string;
  prompt: string;
  version_number: number;
  created_by: string | null;
  created_at: string;
}

const AdminAISettings = () => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [versions, setVersions] = useState<Record<string, PromptVersion[]>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (selectedPrompt) {
      setEditedPrompt(selectedPrompt.prompt);
      loadVersions(selectedPrompt.id);
    }
  }, [selectedPrompt]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('type');

      if (error) throw error;
      setPrompts(data || []);
      
      if (data && data.length > 0 && !selectedPrompt) {
        setSelectedPrompt(data[0]);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Failed to load AI prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async (promptId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVersions(prev => ({
        ...prev,
        [promptId]: data || []
      }));
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt || !user) return;
    
    setIsSaving(true);
    try {
      // Create new version first
      const maxVersion = Math.max(
        0, 
        ...(versions[selectedPrompt.id] || []).map(v => v.version_number)
      );
      
      const { error: versionError } = await supabase
        .from('ai_prompt_versions')
        .insert({
          prompt_id: selectedPrompt.id,
          prompt: selectedPrompt.prompt, // Save the old prompt as a version
          version_number: maxVersion + 1,
          created_by: user.id
        });

      if (versionError) throw versionError;

      // Update the current prompt
      const { error: updateError } = await supabase
        .from('ai_prompts')
        .update({
          prompt: editedPrompt,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPrompt.id);

      if (updateError) throw updateError;

      toast.success('Prompt updated successfully');
      await loadPrompts();
      await loadVersions(selectedPrompt.id);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const rollbackToVersion = async (version: PromptVersion) => {
    if (!selectedPrompt || !user) return;
    
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({
          prompt: version.prompt,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPrompt.id);

      if (error) throw error;

      toast.success('Rolled back to previous version');
      await loadPrompts();
    } catch (error) {
      console.error('Error rolling back:', error);
      toast.error('Failed to rollback');
    }
  };

  const testPrompt = async () => {
    if (!selectedPrompt || !testInput.trim()) return;
    
    setIsTestingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: {
          type: selectedPrompt.type,
          property: {
            title: testInput,
            city: 'Berlin',
            bedrooms: 2,
            square_meters: 80,
            monthly_rent: 1500
          }
        }
      });

      if (error) throw error;
      setTestResult(data.content || 'No result generated');
      toast.success('Test completed');
    } catch (error) {
      console.error('Error testing prompt:', error);
      toast.error('Test failed');
      setTestResult('Test failed: ' + (error as Error).message);
    } finally {
      setIsTestingPrompt(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading AI settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Admin Einstellungen
            </h1>
            <p className="text-muted-foreground">
              Verwalte KI-Prompts und System-Updates
            </p>
          </div>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="prompts">KI-Prompts</TabsTrigger>
            <TabsTrigger value="updates">System-Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Prompt List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">AI Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {prompts.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant={selectedPrompt?.id === prompt.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{prompt.name}</div>
                        <div className="text-xs text-muted-foreground">{prompt.type}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Prompt Editor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {selectedPrompt?.name || 'Select a prompt'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTestModal(true)}
                        disabled={!selectedPrompt}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        onClick={savePrompt}
                        disabled={!selectedPrompt || isSaving || editedPrompt === selectedPrompt?.prompt}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPrompt ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedPrompt.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Last updated: {new Date(selectedPrompt.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>System Prompt</Label>
                        <Textarea
                          value={editedPrompt}
                          onChange={(e) => setEditedPrompt(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                          placeholder="Enter the system prompt for AI generation..."
                        />
                      </div>

                      {editedPrompt !== selectedPrompt.prompt && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            You have unsaved changes. Click "Save" to apply them.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a prompt to edit
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Version History */}
            {selectedPrompt && versions[selectedPrompt.id] && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {versions[selectedPrompt.id].map((version) => (
                      <div key={version.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">v{version.version_number}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(version.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {version.prompt.substring(0, 200)}...
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollbackToVersion(version)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            <UpdateBroadcastPanel />
          </TabsContent>
        </Tabs>

        {/* Test Modal */}
        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Test AI Prompt</DialogTitle>
              <DialogDescription>
                Test the current prompt with sample input
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Test Input</Label>
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="e.g., Modern apartment in Mitte"
                />
              </div>
              
              <Button 
                onClick={testPrompt} 
                disabled={isTestingPrompt || !testInput.trim()}
                className="w-full"
              >
                {isTestingPrompt ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>
              
              {testResult && (
                <div>
                  <Label>Result</Label>
                  <Textarea
                    value={testResult}
                    readOnly
                    rows={6}
                    className="bg-muted"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminAISettings;