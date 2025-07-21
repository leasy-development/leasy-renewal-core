-- Create table for scan reports
CREATE TABLE IF NOT EXISTS public.deepsource_scan_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  repository_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'json')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- Add RLS policies
ALTER TABLE public.deepsource_scan_reports ENABLE ROW LEVEL SECURITY;

-- Users can only access their own reports
CREATE POLICY "Users can view their own scan reports" 
ON public.deepsource_scan_reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create their own scan reports" 
ON public.deepsource_scan_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage all scan reports" 
ON public.deepsource_scan_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_deepsource_scan_reports_user_id ON public.deepsource_scan_reports(user_id);
CREATE INDEX idx_deepsource_scan_reports_scan_id ON public.deepsource_scan_reports(scan_id);
CREATE INDEX idx_deepsource_scan_reports_expires_at ON public.deepsource_scan_reports(expires_at);

-- Add foreign key relationships
ALTER TABLE public.deepsource_scan_reports 
ADD CONSTRAINT fk_deepsource_scan_reports_scan_id 
FOREIGN KEY (scan_id) REFERENCES public.deepsource_scans(id) ON DELETE CASCADE;

ALTER TABLE public.deepsource_scan_reports 
ADD CONSTRAINT fk_deepsource_scan_reports_repository_id 
FOREIGN KEY (repository_id) REFERENCES public.deepsource_repositories(id) ON DELETE CASCADE;