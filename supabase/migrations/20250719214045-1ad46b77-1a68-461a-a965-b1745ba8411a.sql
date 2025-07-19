-- Create table for AI generation logs (analytics)
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_title TEXT,
  tone TEXT,
  format TEXT,
  language TEXT DEFAULT 'en',
  character_count INTEGER,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for AI generation logs
CREATE POLICY "Users can view their own AI generation logs" 
ON public.ai_generation_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generation logs" 
ON public.ai_generation_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all logs for analytics
CREATE POLICY "Admins can view all AI generation logs" 
ON public.ai_generation_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_ai_logs_user_created ON public.ai_generation_logs(user_id, created_at);
CREATE INDEX idx_ai_logs_created_at ON public.ai_generation_logs(created_at);