import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

interface ErrorReportDownloaderProps {
  errors: ValidationError[];
  filename?: string;
  className?: string;
}

export function ErrorReportDownloader({ 
  errors, 
  filename = `upload_errors_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`,
  className 
}: ErrorReportDownloaderProps) {
  const { toast } = useToast();

  const downloadErrorReport = () => {
    if (errors.length === 0) {
      toast({
        title: "No Errors",
        description: "There are no errors to download.",
      });
      return;
    }

    try {
      // Prepare error data for Excel
      const errorData = errors.map((error, index) => ({
        'Error #': index + 1,
        'Row Number': error.row,
        'Field': error.field,
        'Severity': error.severity.toUpperCase(),
        'Error Message': error.message,
        'Value': error.value?.toString() || '',
        'Timestamp': new Date().toISOString()
      }));

      // Add summary row
      const summary = {
        'Error #': 'SUMMARY',
        'Row Number': '',
        'Field': `Total Errors: ${errors.length}`,
        'Severity': `Critical: ${errors.filter(e => e.severity === 'error').length}`,
        'Error Message': `Warnings: ${errors.filter(e => e.severity === 'warning').length}`,
        'Value': '',
        'Timestamp': new Date().toISOString()
      };

      const finalData = [summary, ...errorData];

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(finalData);
      
      // Style the header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E2E8F0' } }
        };
      }

      // Set column widths
      ws['!cols'] = [
        { width: 10 }, // Error #
        { width: 12 }, // Row Number
        { width: 20 }, // Field
        { width: 12 }, // Severity
        { width: 40 }, // Error Message
        { width: 20 }, // Value
        { width: 20 }  // Timestamp
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Upload Errors");

      // Add a second sheet with error statistics
      const stats = [
        { Metric: 'Total Errors', Value: errors.length },
        { Metric: 'Critical Errors', Value: errors.filter(e => e.severity === 'error').length },
        { Metric: 'Warnings', Value: errors.filter(e => e.severity === 'warning').length },
        { Metric: 'Affected Rows', Value: new Set(errors.map(e => e.row)).size },
        { Metric: 'Most Common Field', Value: getMostCommonField(errors) },
        { Metric: 'Report Generated', Value: new Date().toLocaleString() }
      ];

      const statsWs = XLSX.utils.json_to_sheet(stats);
      statsWs['!cols'] = [{ width: 20 }, { width: 30 }];
      XLSX.utils.book_append_sheet(wb, statsWs, "Error Statistics");

      // Download the file
      XLSX.writeFile(wb, filename);

      toast({
        title: "✅ Error Report Downloaded",
        description: `Downloaded ${errors.length} errors to ${filename}`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate error report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getMostCommonField = (errors: ValidationError[]): string => {
    const fieldCounts: Record<string, number> = {};
    errors.forEach(error => {
      fieldCounts[error.field] = (fieldCounts[error.field] || 0) + 1;
    });
    
    const mostCommon = Object.entries(fieldCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    return mostCommon ? `${mostCommon[0]} (${mostCommon[1]} errors)` : 'N/A';
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={downloadErrorReport}
      className={className}
      disabled={errors.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Download Error Report ({errors.length})
    </Button>
  );
}