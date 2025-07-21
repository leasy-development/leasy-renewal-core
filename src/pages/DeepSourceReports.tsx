import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  FileText, 
  Calendar, 
  Code2, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Bug,
  TrendingUp,
  Wrench,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface ScanReport {
  id: string;
  scan_id: string;
  report_type: 'pdf' | 'json';
  file_path: string;
  file_size?: number;
  metadata: {
    issues_count: number;
    generated_at: string;
    format: string;
    repository: {
      organization: string;
      name: string;
      commit_hash: string;
      commit_author: string;
      scan_date: string;
      issues_found: number;
    };
  };
  created_at: string;
  expires_at?: string;
}

interface Issue {
  id: string;
  rule: string;
  title: string;
  description: string;
  file_path: string;
  line_begin: number;
  line_end: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  is_autofixable: boolean;
  suggested_fix: string;
}

const DeepSourceReports = () => {
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deepsource_scan_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []).map(report => ({
        ...report,
        report_type: report.report_type as 'pdf' | 'json',
        metadata: report.metadata as ScanReport['metadata']
      })));
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load scan reports');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFReport = async (report: ScanReport) => {
    setIsGeneratingPDF(true);
    try {
      // Get the latest scan data
      const { data: scanData } = await supabase
        .from('deepsource_scans')
        .select('*')
        .eq('id', report.scan_id)
        .single();

      const { data: issuesData } = await supabase
        .from('deepsource_issues')
        .select('*')
        .eq('repository_id', scanData?.repository_id);

      const issues = issuesData || [];
      const isZeroIssues = issues.length === 0;
      const hasZeroIssueAlert = report.metadata.zero_issue_alert;

      // Create PDF
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const lineHeight = 7;

      // Header with logo placeholder and title
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('DeepSource Security Report', 20, yPosition);
      yPosition += 15;

      // Zero Issue Warning (if applicable)
      if (hasZeroIssueAlert || isZeroIssues) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 0, 0);
        pdf.text('⚠️ WARNING: INTEGRATION ISSUE DETECTED', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('DeepSource returned 0 issues. This likely indicates a configuration problem.', 20, yPosition);
        yPosition += 10;

        // Add troubleshooting section
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Troubleshooting Steps:', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const troubleshootingSteps = [
          '1. Check if analyzers are enabled in .deepsource.toml file',
          '2. Ensure correct organization and repository slugs are configured',
          '3. Verify API key has correct permissions and is not expired',
          '4. Confirm webhook events are being triggered from GitHub',
          '5. Check if the repository is properly connected to DeepSource',
          '6. Verify that the codebase contains files that should be analyzed'
        ];

        troubleshootingSteps.forEach(step => {
          pdf.text(step, 25, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 10;

        // Add validation results if available
        if (report.metadata.validation_results) {
          const validation = report.metadata.validation_results;
          
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('Validation Results:', 20, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Status: ${validation.isValid ? 'Valid' : 'Issues Found'}`, 25, yPosition);
          yPosition += lineHeight;

          if (validation.issues && validation.issues.length > 0) {
            pdf.text('Issues:', 25, yPosition);
            yPosition += lineHeight;
            validation.issues.forEach((issue: string) => {
              pdf.text(`• ${issue}`, 30, yPosition);
              yPosition += lineHeight;
            });
          }

          if (validation.suggestions && validation.suggestions.length > 0) {
            pdf.text('Suggestions:', 25, yPosition);
            yPosition += lineHeight;
            validation.suggestions.forEach((suggestion: string) => {
              pdf.text(`→ ${suggestion}`, 30, yPosition);
              yPosition += lineHeight;
            });
          }
          yPosition += 10;
        }

        // Add separator
        pdf.setLineWidth(0.5);
        pdf.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }

      // Timestamp
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 10;

      // Repository metadata
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Repository Information', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const repoInfo = [
        `Organization: ${report.metadata.repository.organization}`,
        `Repository: ${report.metadata.repository.name}`,
        `Commit: ${report.metadata.repository.commit_hash}`,
        `Author: ${report.metadata.repository.commit_author}`,
        `Scan Date: ${new Date(report.metadata.repository.scan_date).toLocaleString()}`,
        `Scan Duration: ${report.metadata.repository.scan_duration_ms}ms`,
        `Issues Found: ${report.metadata.issues_count}`
      ];

      repoInfo.forEach(line => {
        pdf.text(line, 25, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 10;

      // Scan summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Scan Summary', 20, yPosition);
      yPosition += 10;

      if (issues.length === 0) {
        pdf.setFontSize(12);
        if (hasZeroIssueAlert) {
          pdf.setTextColor(255, 0, 0);
          pdf.text('⚠️ No issues detected - Possible integration problem', 25, yPosition);
        } else {
          pdf.setTextColor(0, 128, 0);
          pdf.text('✅ No issues found', 25, yPosition);
        }
        yPosition += 10;
      } else {
        const severityCounts = {
          critical: issues.filter(i => i.severity === 'critical').length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length
        };

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        Object.entries(severityCounts).forEach(([severity, count]) => {
          if (count > 0) {
            const color = severity === 'critical' ? [255, 0, 0] : 
                         severity === 'high' ? [255, 165, 0] :
                         severity === 'medium' ? [255, 255, 0] : [0, 0, 255];
            pdf.setTextColor(color[0], color[1], color[2]);
            pdf.text(`${severity.toUpperCase()}: ${count}`, 25, yPosition);
            yPosition += lineHeight;
          }
        });
        yPosition += 10;

        // Detailed issue list
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Detailed Issues', 20, yPosition);
        yPosition += 10;

        issues.forEach((issue, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${issue.title}`, 25, yPosition);
          yPosition += lineHeight;

          pdf.setFont(undefined, 'normal');
          pdf.text(`Rule: ${issue.check_id}`, 30, yPosition);
          yPosition += lineHeight;
          
          pdf.text(`File: ${issue.file_path}:${issue.line_begin}-${issue.line_end}`, 30, yPosition);
          yPosition += lineHeight;
          
          pdf.text(`Severity: ${issue.severity.toUpperCase()}`, 30, yPosition);
          yPosition += lineHeight;

          const descriptionLines = pdf.splitTextToSize(issue.description, 150);
          pdf.text(descriptionLines, 30, yPosition);
          yPosition += descriptionLines.length * lineHeight;

          if (issue.fix_summary) {
            pdf.text('Suggested Fix:', 30, yPosition);
            yPosition += lineHeight;
            const fixLines = pdf.splitTextToSize(issue.fix_summary, 145);
            pdf.text(fixLines, 35, yPosition);
            yPosition += fixLines.length * lineHeight;
          }

          yPosition += 5;
        });
      }

      // Footer with additional resources
      if (hasZeroIssueAlert || isZeroIssues) {
        pdf.addPage();
        yPosition = 20;
        
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Additional Resources', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const resources = [
          'DeepSource Documentation: https://docs.deepsource.com/',
          'Configuration Guide: https://docs.deepsource.com/docs/configuration',
          'GitHub Integration: https://docs.deepsource.com/docs/github-integration',
          'Troubleshooting: https://docs.deepsource.com/docs/troubleshooting'
        ];

        resources.forEach(resource => {
          pdf.text(resource, 25, yPosition);
          yPosition += lineHeight;
        });
      }

      // Save PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `deepsource-report-${timestamp}.pdf`;
      pdf.save(fileName);

      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'bug-risk': case 'bug_risk': return <Bug className="h-4 w-4" />;
      case 'anti-pattern': case 'antipattern': return <AlertTriangle className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'style': return <Wrench className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">DeepSource Scan Reports</h1>
        </div>
        <p className="text-muted-foreground">
          Download and manage your code quality scan reports
        </p>
      </div>

      {reports.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            No scan reports available. Run a DeepSource scan to generate your first report.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {report.metadata.repository.organization}/{report.metadata.repository.name}
                    </CardTitle>
                    <CardDescription>
                      Scan from {formatDate(report.metadata.generated_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.metadata.zero_issue_alert && (
                      <Badge variant="destructive" className="animate-pulse">
                        ⚠️ Alert
                      </Badge>
                    )}
                    <Badge variant={report.metadata.issues_count === 0 ? "secondary" : "destructive"}>
                      {report.metadata.issues_count} issues
                    </Badge>
                    <Badge variant="outline">
                      {report.report_type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.metadata.zero_issue_alert && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription>
                        <strong>Integration Warning:</strong> This scan returned 0 issues, which may indicate a configuration problem.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Commit:</span>
                      <div className="font-mono">{report.metadata.repository.commit_hash}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Author:</span>
                      <div>{report.metadata.repository.commit_author}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Size:</span>
                      <div>{formatFileSize(report.file_size)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <div>{report.expires_at ? formatDate(report.expires_at) : 'Never'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => downloadJSONReport(report)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button 
                      onClick={() => generatePDFReport(report)}
                      variant="outline"
                      size="sm"
                      disabled={isGeneratingPDF}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeepSourceReports;
