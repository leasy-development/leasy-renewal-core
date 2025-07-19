// Demo page showcasing all robustness improvements
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusDashboard } from '@/components/StatusDashboard';
import { RealTimeLoadingIndicator, QuickStatus, LiveUpdateIndicator, LoadingStep } from '@/components/RealTimeLoadingIndicator';
import { 
  TestTube2, 
  Shield, 
  Zap, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  BarChart3,
  Smartphone
} from 'lucide-react';

const demoSteps: LoadingStep[] = [
  {
    id: 'validation',
    label: 'Validating CSV Data',
    status: 'completed',
    progress: 100,
    details: '150 rows validated successfully'
  },
  {
    id: 'duplicate-check',
    label: 'Checking for Duplicates',
    status: 'completed',
    progress: 100,
    details: '3 potential duplicates found'
  },
  {
    id: 'property-creation',
    label: 'Creating Properties',
    status: 'in-progress',
    progress: 65,
    details: '97 of 150 properties created',
    estimatedTime: '2m 30s'
  },
  {
    id: 'media-download',
    label: 'Downloading Media',
    status: 'pending',
    details: 'Waiting for property creation to complete'
  }
];

export default function RobustnessDemo() {
  const [activeDemo, setActiveDemo] = useState<'loading' | 'validation' | 'performance'>('loading');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  const simulateUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => setUploadStatus('processing'), 2000);
    setTimeout(() => setUploadStatus('completed'), 5000);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Leasy Robustness Features</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive testing, validation, performance optimization, and real-time user experience improvements
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-blue-500" />
              Unit Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive test coverage for critical functions
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Duplicate Detection Tests</Badge>
              <Badge variant="outline">Media Upload Tests</Badge>
              <Badge variant="outline">CSV Processing Tests</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Input Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Joi schema validation and DOMPurify sanitization
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Schema Validation</Badge>
              <Badge variant="outline">HTML Sanitization</Badge>
              <Badge variant="outline">Type Conversion</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Memoization, throttling, and concurrency control
            </p>
            <div className="space-y-2">
              <Badge variant="outline">React Query Caching</Badge>
              <Badge variant="outline">Concurrency Limiting</Badge>
              <Badge variant="outline">Virtual Scrolling</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Real-time UX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Live progress indicators and status updates
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Progress Tracking</Badge>
              <Badge variant="outline">Live Updates</Badge>
              <Badge variant="outline">Status Dashboard</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Error Handling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced error recovery and fallback systems
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Retry Logic</Badge>
              <Badge variant="outline">Circuit Breakers</Badge>
              <Badge variant="outline">Fallback Handling</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-indigo-500" />
              PWA Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Offline support and native app experience
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Service Worker</Badge>
              <Badge variant="outline">Offline Caching</Badge>
              <Badge variant="outline">Install Prompt</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demos */}
      <Tabs value={activeDemo} onValueChange={(value) => setActiveDemo(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loading">Loading Indicators</TabsTrigger>
          <TabsTrigger value="validation">Validation Demo</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="loading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Loading Indicators</CardTitle>
              <CardDescription>
                Experience the enhanced user feedback during bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={simulateUpload} disabled={uploadStatus !== 'idle'}>
                  Simulate Upload
                </Button>
                <LiveUpdateIndicator isActive={uploadStatus !== 'idle'} />
              </div>

              <QuickStatus 
                status={uploadStatus}
                message={
                  uploadStatus === 'uploading' ? 'Uploading CSV file...' :
                  uploadStatus === 'processing' ? 'Processing 150 properties...' :
                  uploadStatus === 'completed' ? 'All properties uploaded successfully!' :
                  uploadStatus === 'error' ? 'Upload failed - please try again' :
                  'Ready to upload properties'
                }
                progress={
                  uploadStatus === 'uploading' ? 25 :
                  uploadStatus === 'processing' ? 75 :
                  uploadStatus === 'completed' ? 100 : 0
                }
              />

              <RealTimeLoadingIndicator 
                steps={demoSteps}
                currentStep="property-creation"
                overallProgress={65}
                showDetails={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Validation System</CardTitle>
              <CardDescription>
                Comprehensive validation with error reporting and sanitization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Valid Input Examples
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-green-50 rounded border">
                      <strong>Email:</strong> landlord@example.com ✓
                    </div>
                    <div className="p-2 bg-green-50 rounded border">
                      <strong>Rent:</strong> €1,234.56 → 1234.56 ✓
                    </div>
                    <div className="p-2 bg-green-50 rounded border">
                      <strong>HTML:</strong> &lt;script&gt;alert()&lt;/script&gt; → (removed) ✓
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Validation Errors
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-red-50 rounded border">
                      <strong>Required field:</strong> Title cannot be empty
                    </div>
                    <div className="p-2 bg-red-50 rounded border">
                      <strong>Invalid email:</strong> not-an-email
                    </div>
                    <div className="p-2 bg-red-50 rounded border">
                      <strong>Out of range:</strong> Bedrooms: 999 (max: 50)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>
                Real-time performance metrics and optimization features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-blue-600">~85ms</div>
                  <div className="text-sm text-muted-foreground">Duplicate Detection</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">3/sec</div>
                  <div className="text-sm text-muted-foreground">Media Downloads</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-600">~15MB</div>
                  <div className="text-sm text-muted-foreground">Memory Usage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Dashboard Demo */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Status Dashboard</h2>
        <StatusDashboard />
      </div>
    </div>
  );
}