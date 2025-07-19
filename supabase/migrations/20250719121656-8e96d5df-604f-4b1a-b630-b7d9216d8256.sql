-- Create dashboard_widgets table for customizable widgets
CREATE TABLE public.dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chart', 'metric', 'list')),
  title TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT 'small' CHECK (size IN ('small', 'medium', 'large')),
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own widgets" 
ON public.dashboard_widgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widgets" 
ON public.dashboard_widgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" 
ON public.dashboard_widgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets" 
ON public.dashboard_widgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboard_widgets_updated_at
BEFORE UPDATE ON public.dashboard_widgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dashboard widgets
ALTER TABLE public.dashboard_widgets REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE dashboard_widgets;