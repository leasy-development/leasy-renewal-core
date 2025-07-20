import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { autoCategorizeProperty, autoDetectApartmentType } from '@/services/autoCategorization';

interface TestResult {
  category: {
    value: string | null;
    confidence: number;
    reasoning: string;
  };
  apartmentType: {
    value: string | null;
    confidence: number;
    reasoning: string;
  };
}

const DeveloperTestingTool: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);

  // Test cases for quick testing
  const testCases = [
    {
      name: 'Furnished Apartment',
      title: 'Beautiful Furnished 2-Bedroom Apartment in Downtown',
      description: 'Fully furnished apartment with modern amenities, perfect for professionals. Located in the heart of the city.'
    },
    {
      name: 'House for Sale',
      title: 'Spacious Family House for Sale',
      description: 'Large family home with 4 bedrooms, garden, and garage. Perfect for families looking to buy their dream home.'
    },
    {
      name: 'Serviced Apartment',
      title: 'Premium Serviced Apartment',
      description: 'Hotel-style serviced apartment with daily cleaning, concierge service, and business facilities.'
    },
    {
      name: 'No Clear Category',
      title: 'Property Listing',
      description: 'Nice place to stay.'
    },
    {
      name: 'Missing Fields (Test Blocker)',
      title: '',
      description: ''
    }
  ];

  const runTest = () => {
    const categoryResult = autoCategorizeProperty(title, description);
    const apartmentTypeResult = autoDetectApartmentType(title, description);

    setResult({
      category: {
        value: categoryResult.category,
        confidence: categoryResult.confidence,
        reasoning: categoryResult.reasoning
      },
      apartmentType: {
        value: apartmentTypeResult.type,
        confidence: apartmentTypeResult.confidence,
        reasoning: apartmentTypeResult.reasoning
      }
    });
  };

  const loadTestCase = (testCase: any) => {
    setTitle(testCase.title);
    setDescription(testCase.description);
    setResult(null);
  };

  const simulateMissingFieldsScenario = () => {
    // This simulates a CSV file without category/apartment_type columns
    alert('🧪 Developer Test: This simulates uploading a CSV file that lacks category and apartment_type columns.\n\nExpected behavior:\n✅ UI should NOT block\n✅ Show soft warning instead of error\n✅ Auto-categorization should kick in during import\n✅ Mapping suggestions should work from past uploads');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Developer Testing Tool</h1>
          <p className="text-muted-foreground">Test auto-categorization and mapping fallbacks</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Auto-Categorization Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title</Label>
              <Textarea
                id="title"
                placeholder="Enter property title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter property description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={runTest} className="flex-1">
                Test Auto-Categorization
              </Button>
              <Button variant="outline" onClick={simulateMissingFieldsScenario}>
                🧪 Test Missing Fields
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Quick Test Cases:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {testCases.map((testCase, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadTestCase(testCase)}
                    className="text-left justify-start"
                  >
                    {testCase.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Category Results */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-semibold">Category Detection:</Label>
                    {result.category.value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  {result.category.value ? (
                    <div className="space-y-2">
                      <Badge variant="default" className="text-sm">
                        {result.category.value}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {Math.round(result.category.confidence * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.category.reasoning}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.category.reasoning}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Apartment Type Results */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-semibold">Apartment Type Detection:</Label>
                    {result.apartmentType.value ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  {result.apartmentType.value ? (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-sm">
                        {result.apartmentType.value}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {Math.round(result.apartmentType.confidence * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.apartmentType.reasoning}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.apartmentType.reasoning}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Overall Assessment */}
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-semibold">Overall Assessment:</Label>
                  <div className="text-sm mt-1">
                    {result.category.value && result.apartmentType.value ? (
                      <span className="text-green-600">✅ Full auto-categorization successful</span>
                    ) : result.category.value || result.apartmentType.value ? (
                      <span className="text-yellow-600">⚠️ Partial auto-categorization</span>
                    ) : (
                      <span className="text-red-600">❌ Manual input required</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter property details and click "Test Auto-Categorization" to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>✅ Non-blocking UI:</strong> Upload CSV without category/apartment_type columns - should show warning, not error
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>✅ "Don't Map" option:</strong> Available for all non-required fields in dropdown
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>✅ Smart suggestions:</strong> Past mappings appear with "💡 Suggested from past" label
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>✅ Visual improvements:</strong> Leasy fields have blue badges, already selected fields are disabled
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>✅ Auto-categorization:</strong> AI fallback works when category/type fields are missing
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperTestingTool;