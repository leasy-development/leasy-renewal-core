import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, RefreshCw, Check, X } from 'lucide-react';
import { aiListingService, PropertyData } from '@/services/aiListingService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AIFieldAssistantProps {
  fieldType: 'title' | 'description';
  property: PropertyData;
  currentValue: string;
  onValueUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'simple', label: 'Simple' },
  { value: 'family-friendly', label: 'Family-Friendly' },
];

export const AIFieldAssistant: React.FC<AIFieldAssistantProps> = ({
  fieldType,
  property,
  currentValue,
  onValueUpdate,
  placeholder,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [followUpPrompt, setFollowUpPrompt] = useState('');

  const generateContent = async (customPrompt?: string) => {
    setIsGenerating(true);
    try {
      let result;
      if (fieldType === 'title') {
        result = await aiListingService.generateTitle(property, customPrompt || `Create a ${selectedTone} title`);
      } else {
        result = await aiListingService.generateDescription(property, {
          tone: selectedTone,
          customPrompt,
        });
      }
      
      const content = result.content.trim();
      setGeneratedContent(content);
      setEditedContent(content);
      toast.success(`AI ${fieldType} generated!`);
    } catch (error) {
      console.error(`Error generating ${fieldType}:`, error);
      toast.error(`Failed to generate ${fieldType}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    if (!generatedContent) {
      generateContent();
    }
  };

  const handleAccept = () => {
    onValueUpdate(editedContent);
    setShowModal(false);
    toast.success(`${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} updated!`);
  };

  const handleRegenerate = () => {
    if (followUpPrompt.trim()) {
      generateContent(followUpPrompt);
      setFollowUpPrompt('');
    } else {
      generateContent();
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setGeneratedContent('');
    setEditedContent('');
    setFollowUpPrompt('');
  };

  const isTitle = fieldType === 'title';

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2">
          {isTitle ? (
            <Input
              value={currentValue}
              onChange={(e) => onValueUpdate(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
          ) : (
            <Textarea
              value={currentValue}
              onChange={(e) => onValueUpdate(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="flex-1 resize-none"
            />
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            className="shrink-0 flex items-center gap-2"
            title={`Generate ${fieldType} with AI`}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI {isTitle ? 'Title' : 'Description'} Generator
            </DialogTitle>
            <DialogDescription>
              Generate and customize your property {fieldType} using AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generated Content */}
            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Generating {fieldType}...</span>
              </div>
            ) : generatedContent ? (
              <div className="space-y-4">
                <div>
                  <Label>Generated {isTitle ? 'Title' : 'Description'}</Label>
                  {isTitle ? (
                    <Input
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={6}
                      className="mt-2 resize-none"
                    />
                  )}
                </div>

                {/* Follow-up Prompt */}
                <div className="space-y-2">
                  <Label>Refine with custom instructions (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={followUpPrompt}
                      onChange={(e) => setFollowUpPrompt(e.target.value)}
                      placeholder="e.g., 'make it more family-friendly' or 'add neighborhood highlights'"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              {generatedContent && (
                <Button onClick={handleAccept} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Accept & Use
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};