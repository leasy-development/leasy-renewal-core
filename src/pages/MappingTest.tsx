import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, TestTube, FileSpreadsheet, Brain } from 'lucide-react';
import { ColumnMapper } from '@/components/ColumnMapper';
import DeveloperTestingTool from '@/components/DeveloperTestingTool';

const MappingTestPage: React.FC = () => {
  const [showMapper, setShowMapper] = useState(false);
  const [testScenario, setTestScenario] = useState<string>('');

  // Test scenarios for different CSV structures
  const testScenarios = [
    {
      name: 'Complete CSV with All Fields',
      description: 'CSV includes category and apartment_type columns',
      headers: ['property_title', 'description', 'category', 'apartment_type', 'street_name', 'monthly_rent', 'bedrooms'],
      expected: 'Should auto-map most fields, no warnings'
    },
    {
      name: 'Missing Category Column (BLOCKER TEST)',
      description: 'CSV without category field - this used to block users',
      headers: ['property_title', 'description', 'apartment_type', 'street_name', 'monthly_rent', 'bedrooms'],
      expected: 'Should show soft warning, not block, enable auto-categorization'
    },
    {
      name: 'Missing Both Category and Type',
      description: 'CSV without category or apartment_type',
      headers: ['property_title', 'description', 'street_name', 'monthly_rent', 'bedrooms', 'bathrooms'],
      expected: 'Should show warning about AI fallback, not block import'
    },
    {
      name: 'Minimal Required Fields Only',
      description: 'Only essential required fields present',
      headers: ['title', 'street_name'],
      expected: 'Should work fine, show optional field warnings'
    },
    {
      name: 'Past Mapping Memory Test',
      description: 'Headers similar to previously mapped ones',
      headers: ['prop_title', 'prop_desc', 'rental_category', 'unit_type', 'street', 'rent_monthly'],
      expected: 'Should show suggestions with lightbulb icon'
    }
  ];

  const handleMappingComplete = (mapping: Record<string, string>) => {
    console.log('Mapping completed:', mapping);
    alert(`✅ Mapping successful!\n\nMapped fields:\n${Object.entries(mapping).map(([k, v]) => `${k} → ${v}`).join('\n')}\n\n🔍 Check console for full mapping details.`);
    setShowMapper(false);
  };

  const handleCancel = () => {
    setShowMapper(false);
  };

  const runScenarioTest = (scenario: any) => {
    setTestScenario(scenario.name);
    setShowMapper(true);
  };

  if (showMapper) {
    const scenario = testScenarios.find(s => s.name === testScenario);
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              <strong>Testing Scenario:</strong> {scenario?.name}<br />
              <strong>Expected:</strong> {scenario?.expected}
            </AlertDescription>
          </Alert>
        </div>
        
        <ColumnMapper
          csvHeaders={scenario?.headers || []}
          onMappingComplete={handleMappingComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Leasy Mapping Test Suite</h1>
          <p className="text-muted-foreground">Test the improved column mapping system</p>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="categorization">AI Categorization</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Column Mapping Test Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testScenarios.map((scenario, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-medium">{scenario.name}</h3>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.headers.map(header => (
                          <Badge key={header} variant="outline" className="text-xs">
                            {header}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-green-600">
                        <strong>Expected:</strong> {scenario.expected}
                      </div>
                    </div>
                    <Button 
                      onClick={() => runScenarioTest(scenario)}
                      size="sm"
                    >
                      Test Scenario
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorization">
          <DeveloperTestingTool />
        </TabsContent>

        <TabsContent value="improvements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                System Improvements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-600">✅ Completed Improvements</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <strong>Made category & apartment_type optional</strong>
                        <p className="text-muted-foreground">No longer blocks import when missing</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <strong>Added "Don't Map" option</strong>
                        <p className="text-muted-foreground">🚫 Don't Map available for non-required fields</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <strong>Enabled mapping memory</strong>
                        <p className="text-muted-foreground">💡 Suggestions from past mappings with lightbulb icon</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <strong>Auto-categorization fallback</strong>
                        <p className="text-muted-foreground">AI analyzes title/description for missing categories</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-blue-600">🎨 UI Improvements</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <strong>Blue badges for Leasy fields</strong>
                        <p className="text-muted-foreground">Visual distinction for database fields</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <strong>Disabled already selected fields</strong>
                        <p className="text-muted-foreground">Prevents duplicate mappings</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <strong>Non-blocking warnings</strong>
                        <p className="text-muted-foreground">Soft alerts instead of blocking errors</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <strong>Improved dropdown styling</strong>
                        <p className="text-muted-foreground">Better z-index and background colors</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Developer Note:</strong> Test with CSV files missing category/apartment_type columns. 
                  The system should now show warnings instead of blocking errors, and auto-categorization 
                  should activate during the import process.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingTestPage;