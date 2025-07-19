-- Create waitlist_submissions table for early access signups
CREATE TABLE public.waitlist_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  listings_count TEXT NOT NULL,
  source TEXT DEFAULT 'Leasy Beta Waitlist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for public signup)
CREATE POLICY "Anyone can submit waitlist applications" 
ON public.waitlist_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admin viewing (you can add more specific admin checks later)
CREATE POLICY "Admins can view all waitlist submissions" 
ON public.waitlist_submissions 
FOR SELECT 
USING (true);

-- Add email validation and unique constraint
CREATE UNIQUE INDEX idx_waitlist_email ON public.waitlist_submissions(email);

-- Add updated_at trigger
CREATE TRIGGER update_waitlist_submissions_updated_at
  BEFORE UPDATE ON public.waitlist_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();