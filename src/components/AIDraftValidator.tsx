import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Loader2, Wand2 } from 'lucide-react';
import { aiListingService, PropertyData } from '@/services/aiListingService';
import { toast } from 'sonner';

interface ValidationResult {
  quality_score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    field: string;
    message: string;
    suggestion?: string;
  }>;
  suggestions: string[];
}

interface AIDraftValidatorProps {
  property: PropertyData;
  onImprovementSuggestion: (field: string, suggestion: string) => void;
}

export const AIDraftValidator: React.FC<AIDraftValidatorProps> = ({
  property,
  onImprovementSuggestion,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [autoValidate, setAutoValidate] = useState(true);

  const validateDraft = async () => {
    setIsValidating(true);
    try {
      const result = await aiListingService.validateDraft(property);
      
      // Parse the AI response into structured validation result
      const parsed = JSON.parse(result.content);
      setValidationResult(parsed);
      
      if (parsed.quality_score < 60) {
        toast.warning('Draft quality could be improved');
      } else if (parsed.quality_score > 80) {
        toast.success('Excellent draft quality!');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate draft');
    } finally {
      setIsValidating(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIssueVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      case 'suggestion':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const applySuggestion = (field: string, suggestion: string) => {
    onImprovementSuggestion(field, suggestion);
    toast.success(`Applied suggestion for ${field}`);
  };

  useEffect(() => {
    if (autoValidate && property.title) {
      validateDraft();
    }
  }, [property.title, property.description, autoValidate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Draft Quality Validator
          </CardTitle>
          <Button
            onClick={validateDraft}
            disabled={isValidating}
            size="sm"
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isValidating ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing draft quality...</span>
          </div>
        ) : validationResult ? (
          <div className="space-y-4">
            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Score</span>
                <span className={`text-sm font-bold ${getQualityColor(validationResult.quality_score)}`}>
                  {validationResult.quality_score}/100 - {getQualityLabel(validationResult.quality_score)}
                </span>
              </div>
              <Progress value={validationResult.quality_score} className="h-2" />
            </div>

            {/* Issues */}
            {validationResult.issues.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Issues Found</h4>
                {validationResult.issues.map((issue, index) => (
                  <Alert key={index} variant={getIssueVariant(issue.type)}>
                    <div className="flex items-start gap-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {issue.field}
                          </Badge>
                          <Badge variant={getIssueVariant(issue.type)} className="text-xs">
                            {issue.type}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {issue.message}
                        </AlertDescription>
                        {issue.suggestion && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applySuggestion(issue.field, issue.suggestion!)}
                              className="text-xs"
                            >
                              Apply Suggestion
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {/* General Suggestions */}
            {validationResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Improvement Suggestions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.quality_score >= 80 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Great job! Your listing meets high quality standards.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Validate" to analyze your draft quality</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};