-- Add missing fields to deepsource_issues table for proper DeepSource display
ALTER TABLE public.deepsource_issues ADD COLUMN IF NOT EXISTS occurrence_count integer DEFAULT 1;
ALTER TABLE public.deepsource_issues ADD COLUMN IF NOT EXISTS file_count integer DEFAULT 1;
ALTER TABLE public.deepsource_issues ADD COLUMN IF NOT EXISTS first_seen_at timestamp with time zone DEFAULT now();
ALTER TABLE public.deepsource_issues ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Add index for better performance on category-based queries
CREATE INDEX IF NOT EXISTS idx_deepsource_issues_category ON public.deepsource_issues(category);
CREATE INDEX IF NOT EXISTS idx_deepsource_issues_severity ON public.deepsource_issues(severity);
CREATE INDEX IF NOT EXISTS idx_deepsource_issues_status ON public.deepsource_issues(status);

-- Create a view for issue aggregation stats
CREATE OR REPLACE VIEW public.deepsource_issue_stats AS
SELECT 
  category,
  severity,
  status,
  COUNT(*) as issue_count,
  SUM(occurrence_count) as total_occurrences,
  SUM(file_count) as total_files_affected
FROM public.deepsource_issues
GROUP BY category, severity, status;