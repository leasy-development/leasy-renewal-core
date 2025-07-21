
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

interface ZeroIssueAlertProps {
  isVisible: boolean;
  validationResults?: ValidationResult;
  onReconfigure: () => void;
  onRevalidate: () => void;
  onDismiss: () => void;
  isRevalidating?: boolean;
}

const DeepSourceZeroIssueAlert: React.FC<ZeroIssueAlertProps> = ({
  isVisible,
  validationResults,
  onReconfigure,
  onRevalidate,
  onDismiss,
  isRevalidating = false
}) => {
  if (!isVisible) return null;

  return (
    <div className="mb-6">
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription>
          <div className="space-y-4">
            <div className="font-semibold text-destructive">
              ⚠️ Warning: DeepSource returned 0 issues. This likely indicates an integration issue.
            </div>
            
            {validationResults && (
              <div className="space-y-3">
                <div className="text-sm font-medium">
                  Integration Status: {validationResults.isValid ? (
                    <span className="text-green-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </span>
                  ) : (
                    <span className="text-destructive inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Issues Found
                    </span>
                  )}
                </div>
                
                {validationResults.issues.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Issues:</div>
                    <ul className="text-sm space-y-1">
                      {validationResults.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResults.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Suggestions:</div>
                    <ul className="text-sm space-y-1">
                      {validationResults.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">→</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="text-sm font-medium">Common Solutions:</div>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">1.</span>
                  <span>Check if analyzers are enabled in <code className="bg-muted px-1 rounded">.deepsource.toml</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">2.</span>
                  <span>Ensure correct organization and repository slugs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">3.</span>
                  <span>Verify API key has correct permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">4.</span>
                  <span>Confirm webhook events are being triggered from GitHub</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={onRevalidate}
                disabled={isRevalidating}
                variant="outline"
                size="sm"
              >
                {isRevalidating ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                Revalidate
              </Button>
              
              <Button
                onClick={onReconfigure}
                variant="outline"
                size="sm"
              >
                <Settings className="h-3 w-3 mr-2" />
                Reconfigure Integration
              </Button>
              
              <Button
                onClick={() => window.open('https://docs.deepsource.com/docs/getting-started', '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                DeepSource Docs
              </Button>
              
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DeepSourceZeroIssueAlert;
