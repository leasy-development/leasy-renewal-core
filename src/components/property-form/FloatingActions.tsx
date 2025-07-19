import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, Eye, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionsProps {
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview?: () => void;
  isLoading?: boolean;
  isDirty?: boolean;
  className?: string;
}

export function FloatingActions({ 
  onSaveDraft, 
  onPublish, 
  onPreview,
  isLoading = false,
  isDirty = false,
  className 
}: FloatingActionsProps) {
  return (
    <Card className={cn(
      "fixed bottom-6 right-6 p-4 shadow-lg border bg-background/95 backdrop-blur-sm",
      "animate-fade-in",
      className
    )}>
      <div className="flex items-center gap-3">
        {isDirty && (
          <span className="text-sm text-muted-foreground">
            Unsaved changes
          </span>
        )}
        <div className="flex gap-2">
          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              disabled={isLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>
    </Card>
  );
}