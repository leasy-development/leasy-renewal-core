
-- Create table for storing DeepSource repository configurations
CREATE TABLE public.deepsource_repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_slug TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  repository_url TEXT,
  api_token_configured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_slug, repository_name)
);

-- Create table for storing actual DeepSource issues
CREATE TABLE public.deepsource_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.deepsource_repositories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deepsource_issue_id TEXT NOT NULL,
  check_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  line_begin INTEGER,
  line_end INTEGER,
  category TEXT NOT NULL, -- 'security', 'performance', 'style', 'complexity', etc.
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'fixed', 'ignored', 'fixing'
  is_autofixable BOOLEAN DEFAULT false,
  fix_applied_at TIMESTAMP WITH TIME ZONE,
  fix_method TEXT, -- 'manual', 'auto', 'ai'
  fix_summary TEXT,
  raw_issue_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(repository_id, deepsource_issue_id)
);

-- Create table for tracking scan history
CREATE TABLE public.deepsource_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.deepsource_repositories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'webhook'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  issues_found INTEGER DEFAULT 0,
  issues_fixed INTEGER DEFAULT 0,
  issues_new INTEGER DEFAULT 0,
  issues_resolved INTEGER DEFAULT 0,
  scan_duration_ms INTEGER,
  error_message TEXT,
  scan_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.deepsource_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deepsource_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deepsource_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies for repositories
CREATE POLICY "Users can manage their own repositories"
ON public.deepsource_repositories FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all repositories"
ON public.deepsource_repositories FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for issues
CREATE POLICY "Users can manage issues for their repositories"
ON public.deepsource_issues FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all issues"
ON public.deepsource_issues FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for scans
CREATE POLICY "Users can manage their own scans"
ON public.deepsource_scans FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scans"
ON public.deepsource_scans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_deepsource_repositories_user_id ON public.deepsource_repositories(user_id);
CREATE INDEX idx_deepsource_repositories_active ON public.deepsource_repositories(is_active) WHERE is_active = true;

CREATE INDEX idx_deepsource_issues_repository_id ON public.deepsource_issues(repository_id);
CREATE INDEX idx_deepsource_issues_user_id ON public.deepsource_issues(user_id);
CREATE INDEX idx_deepsource_issues_status ON public.deepsource_issues(status);
CREATE INDEX idx_deepsource_issues_category ON public.deepsource_issues(category);
CREATE INDEX idx_deepsource_issues_severity ON public.deepsource_issues(severity);
CREATE INDEX idx_deepsource_issues_created_at ON public.deepsource_issues(created_at);

CREATE INDEX idx_deepsource_scans_repository_id ON public.deepsource_scans(repository_id);
CREATE INDEX idx_deepsource_scans_user_id ON public.deepsource_scans(user_id);
CREATE INDEX idx_deepsource_scans_status ON public.deepsource_scans(status);
CREATE INDEX idx_deepsource_scans_created_at ON public.deepsource_scans(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_deepsource_repositories_updated_at
BEFORE UPDATE ON public.deepsource_repositories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deepsource_issues_updated_at
BEFORE UPDATE ON public.deepsource_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deepsource_scans_updated_at
BEFORE UPDATE ON public.deepsource_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
