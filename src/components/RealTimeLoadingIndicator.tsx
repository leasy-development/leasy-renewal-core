// Enhanced real-time loading indicators for bulk upload operations
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Download,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'warning';
  progress?: number;
  details?: string;
  estimatedTime?: string;
}

interface RealTimeLoadingIndicatorProps {
  steps: LoadingStep[];
  currentStep?: string;
  overallProgress?: number;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function RealTimeLoadingIndicator({
  steps,
  currentStep,
  overallProgress,
  showDetails = true,
  compact = false,
  className
}: RealTimeLoadingIndicatorProps) {
  const getStepIcon = (status: LoadingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepVariant = (status: LoadingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'in-progress':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Overall progress */}
        {typeof overallProgress === 'number' && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Current step indicator */}
        {currentStep && (
          <div className="flex items-center space-x-2 text-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-muted-foreground">
              {steps.find(s => s.id === currentStep)?.label || 'Processing...'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall progress */}
      {typeof overallProgress === 'number' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Upload Progress</h4>
            <span className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}% complete
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>
      )}

      {/* Step-by-step progress */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={cn(
              'flex items-start space-x-3 p-3 rounded-lg border transition-all',
              step.status === 'in-progress' && 'bg-blue-50 border-blue-200',
              step.status === 'completed' && 'bg-green-50 border-green-200',
              step.status === 'failed' && 'bg-red-50 border-red-200',
              step.status === 'warning' && 'bg-yellow-50 border-yellow-200'
            )}
          >
            {/* Step icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step.status)}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">{step.label}</h5>
                <Badge variant={getStepVariant(step.status)} className="ml-2">
                  {step.status.replace('-', ' ')}
                </Badge>
              </div>

              {/* Step details */}
              {showDetails && step.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {step.details}
                </p>
              )}

              {/* Step progress */}
              {step.progress !== undefined && step.status === 'in-progress' && (
                <div className="mt-2 space-y-1">
                  <Progress value={step.progress} className="h-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(step.progress)}%</span>
                    {step.estimatedTime && (
                      <span>~{step.estimatedTime} remaining</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground pt-2 border-t">
        <Zap className="h-3 w-3" />
        <span>Real-time updates active</span>
      </div>
    </div>
  );
}

// Quick status indicator for minimal space
interface QuickStatusProps {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  progress?: number;
  className?: string;
}

export function QuickStatus({ status, message, progress, className }: QuickStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: <Upload className="h-4 w-4 animate-bounce" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          label: 'Uploading'
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          label: 'Processing'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: 'Completed'
        };
      case 'error':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: 'Error'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/20',
          label: 'Ready'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn('flex items-center space-x-3 p-3 rounded-lg', config.bgColor, className)}>
      <div className={config.color}>
        {config.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{config.label}</span>
          {progress !== undefined && (
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        {message && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {message}
          </p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </div>
    </div>
  );
}

// Pulse indicator for live updates
export function LiveUpdateIndicator({ isActive = false }: { isActive?: boolean }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center space-x-2 text-xs text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>Live updates</span>
    </div>
  );
}