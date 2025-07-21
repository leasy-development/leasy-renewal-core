
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  ExternalLink,
  Code2,
  GitBranch,
  Key
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

interface ConfigValidatorProps {
  onValidationComplete: (results: ValidationResult) => void;
}

const DeepSourceConfigValidator: React.FC<ConfigValidatorProps> = ({
  onValidationComplete
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        body: {
          action: 'validate_integration',
          organizationSlug: 'leasy-development',
          repositoryName: 'leasy-renewal-core'
        }
      });

      if (error) throw error;

      setValidationResults(data);
      onValidationComplete(data);
      
      if (data.isValid) {
        toast.success('Integration validation passed!');
      } else {
        toast.error('Integration validation failed');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Failed to validate integration');
      
      const fallbackResult = {
        isValid: false,
        issues: ['Failed to connect to DeepSource API'],
        suggestions: ['Check network connectivity and try again']
      };
      
      setValidationResults(fallbackResult);
      onValidationComplete(fallbackResult);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    if (isValid) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    if (isValid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>;
    }
    return <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Integration Configuration
        </CardTitle>
        <CardDescription>
          Validate your DeepSource integration settings and troubleshoot issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Repository Configuration</div>
            <div className="text-sm text-muted-foreground">
              leasy-development/leasy-renewal-core
            </div>
          </div>
          <Button
            onClick={runValidation}
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Validate Integration
          </Button>
        </div>

        {validationResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.isValid)}
                <span className="font-medium">Integration Status</span>
              </div>
              {getStatusBadge(validationResults.isValid)}
            </div>

            {validationResults.issues.length > 0 && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Issues Found:</div>
                    <ul className="space-y-1">
                      {validationResults.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResults.suggestions.length > 0 && (
              <Alert className="border-blue-500/50 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Suggestions:</div>
                    <ul className="space-y-1">
                      {validationResults.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">→</span>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="font-medium">Configuration Checklist</div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Key className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">API Key</div>
                <div className="text-xs text-muted-foreground">
                  Valid DeepSource API token configured
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <GitBranch className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">Repository Access</div>
                <div className="text-xs text-muted-foreground">
                  Repository connected to DeepSource
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Code2 className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">Analyzers</div>
                <div className="text-xs text-muted-foreground">
                  Code analyzers enabled in .deepsource.toml
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => window.open('https://app.deepsource.com/gh/leasy-development/leasy-renewal-core', '_blank')}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Open DeepSource
          </Button>
          
          <Button
            onClick={() => window.open('https://docs.deepsource.com/docs/configuration', '_blank')}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Configuration Docs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeepSourceConfigValidator;
