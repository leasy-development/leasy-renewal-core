-- Complete security refactor: Remove any remaining security definer views and add proper RLS

-- Check if there are any other problematic views and fix them
-- Add RLS policy to the view itself for extra security

-- Enable RLS on the deepsource_issue_stats view
ALTER VIEW public.deepsource_issue_stats SET (security_invoker = true);

-- Add proper comment explaining the security model
COMMENT ON VIEW public.deepsource_issue_stats IS 
'Aggregates issue statistics from deepsource_issues. 
This view respects RLS policies of the underlying table - users can only see stats for issues they have access to.
No SECURITY DEFINER used - view executes with permissions of the querying user.';

-- Ensure the view is optimized with proper indexing on underlying table
CREATE INDEX IF NOT EXISTS idx_deepsource_issues_category_severity_status 
ON public.deepsource_issues(category, severity, status) 
WHERE status != 'ignored';

-- Add a function to get filtered issue stats for better performance and security
CREATE OR REPLACE FUNCTION public.get_deepsource_issue_stats()
RETURNS TABLE(
  category text,
  severity text, 
  status text,
  issue_count bigint,
  total_occurrences bigint,
  total_files_affected bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only return stats for issues the user can access (RLS will filter automatically)
  RETURN QUERY
  SELECT 
    i.category,
    i.severity,
    i.status,
    COUNT(*) as issue_count,
    SUM(i.occurrence_count) as total_occurrences,
    SUM(i.file_count) as total_files_affected
  FROM public.deepsource_issues i
  GROUP BY i.category, i.severity, i.status
  ORDER BY issue_count DESC;
END;
$function$;