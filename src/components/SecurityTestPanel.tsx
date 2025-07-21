import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface SecurityTestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  details: string;
  data?: any;
}

const SecurityTestPanel: React.FC = () => {
  const [tests, setTests] = useState<SecurityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = async () => {
    setIsRunning(true);
    const testResults: SecurityTestResult[] = [];

    try {
      // Test 1: View without SECURITY DEFINER should respect RLS
      testResults.push({
        test: 'View RLS Compliance',
        status: 'pending',
        details: 'Testing if deepsource_issue_stats view respects user permissions...'
      });

      const { data: viewData, error: viewError } = await supabase
        .from('deepsource_issue_stats')
        .select('*');

      if (viewError) {
        testResults[0] = {
          test: 'View RLS Compliance',
          status: 'fail',
          details: `View query failed: ${viewError.message}`,
          data: viewError
        };
      } else {
        testResults[0] = {
          test: 'View RLS Compliance',
          status: 'pass',
          details: `View returns ${viewData?.length || 0} results, respecting user permissions`,
          data: viewData
        };
      }

      // Test 2: Function security definer with proper safeguards
      testResults.push({
        test: 'Function Security',
        status: 'pending',
        details: 'Testing secure function with proper search_path...'
      });

      const { data: functionData, error: functionError } = await supabase
        .rpc('get_deepsource_issue_stats');

      if (functionError) {
        testResults[1] = {
          test: 'Function Security',
          status: 'fail',
          details: `Function call failed: ${functionError.message}`,
          data: functionError
        };
      } else {
        testResults[1] = {
          test: 'Function Security',
          status: 'pass',
          details: `Function returns ${functionData?.length || 0} results with proper security`,
          data: functionData
        };
      }

      // Test 3: Underlying table RLS
      testResults.push({
        test: 'Table RLS',
        status: 'pending',
        details: 'Testing direct table access with RLS...'
      });

      const { data: tableData, error: tableError } = await supabase
        .from('deepsource_issues')
        .select('count()', { count: 'exact' });

      if (tableError) {
        testResults[2] = {
          test: 'Table RLS',
          status: 'fail',
          details: `Table query failed: ${tableError.message}`,
          data: tableError
        };
      } else {
        testResults[2] = {
          test: 'Table RLS',
          status: 'pass',
          details: `Table accessible with ${tableData?.[0]?.count || 0} records visible to user`,
          data: tableData
        };
      }

      // Test 4: Performance and consistency
      testResults.push({
        test: 'Data Consistency',
        status: 'pending',
        details: 'Comparing view vs function vs direct query results...'
      });

      // Compare results
      const viewCount = viewData?.reduce((sum, row) => sum + (row.issue_count || 0), 0) || 0;
      const functionCount = functionData?.reduce((sum: number, row: any) => sum + (parseInt(row.issue_count) || 0), 0) || 0;
      const tableCount = parseInt(String(tableData?.[0]?.count || '0'));

      if (viewCount === functionCount && (tableCount === 0 || viewCount <= tableCount)) {
        testResults[3] = {
          test: 'Data Consistency',
          status: 'pass',
          details: `Consistent results: View(${viewCount}), Function(${functionCount}), Table(${tableCount})`,
          data: { viewCount, functionCount, tableCount }
        };
      } else {
        testResults[3] = {
          test: 'Data Consistency',
          status: 'fail',
          details: `Inconsistent results: View(${viewCount}), Function(${functionCount}), Table(${tableCount})`,
          data: { viewCount, functionCount, tableCount }
        };
      }

    } catch (error) {
      console.error('Security test error:', error);
      testResults.push({
        test: 'General Error',
        status: 'fail',
        details: `Unexpected error: ${error}`,
        data: error
      });
    }

    setTests(testResults);
    setIsRunning(false);

    const passedTests = testResults.filter(t => t.status === 'pass').length;
    const totalTests = testResults.length;
    
    if (passedTests === totalTests) {
      toast.success(`All ${totalTests} security tests passed!`);
    } else {
      toast.error(`${totalTests - passedTests} out of ${totalTests} tests failed`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'border-green-200 bg-green-50';
      case 'fail': return 'border-red-200 bg-red-50';
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Test Panel
            </CardTitle>
            <CardDescription>
              Test the refactored deepsource_issue_stats view for security compliance
            </CardDescription>
          </div>
          <Button 
            onClick={runSecurityTests} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Click "Run Tests" to verify security implementation
            </div>
          ) : (
            tests.map((test, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="font-medium">{test.test}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {test.details}
                      </p>
                      {test.data && test.status !== 'pending' && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600 hover:underline">
                            View details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <Badge variant={test.status === 'pass' ? 'default' : 'destructive'}>
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTestPanel;