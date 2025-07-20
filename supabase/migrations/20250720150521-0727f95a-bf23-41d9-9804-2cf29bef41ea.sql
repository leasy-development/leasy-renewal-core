-- Create code_fix_log table for tracking all code fixes
CREATE TABLE public.code_fix_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issue_code TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER,
  status TEXT NOT NULL CHECK (status IN ('fixed', 'skipped', 'error', 'ignored', 'manual_fix')),
  fix_summary TEXT,
  error_details TEXT,
  deepsource_issue_id TEXT,
  fix_method TEXT DEFAULT 'auto', -- 'auto', 'manual', 'ignored'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_fix_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own fix logs" 
ON public.code_fix_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fix logs" 
ON public.code_fix_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all fix logs" 
ON public.code_fix_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_code_fix_log_user_id ON public.code_fix_log(user_id);
CREATE INDEX idx_code_fix_log_issue_code ON public.code_fix_log(issue_code);
CREATE INDEX idx_code_fix_log_status ON public.code_fix_log(status);
CREATE INDEX idx_code_fix_log_created_at ON public.code_fix_log(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_code_fix_log_updated_at
BEFORE UPDATE ON public.code_fix_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();