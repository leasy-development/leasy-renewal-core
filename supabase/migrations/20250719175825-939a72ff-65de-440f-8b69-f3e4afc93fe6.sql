-- Create admin roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'moderator' THEN 2 
      WHEN 'user' THEN 3 
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Global duplicate detection tables
CREATE TABLE public.global_duplicate_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confidence_score DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, merged, dismissed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  merge_target_property_id UUID REFERENCES public.properties(id),
  notes TEXT
);

CREATE TABLE public.global_duplicate_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duplicate_group_id UUID REFERENCES public.global_duplicate_groups(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  similarity_reasons JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(duplicate_group_id, property_id)
);

-- Duplicate detection audit log
CREATE TABLE public.duplicate_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- scan, merge, dismiss, review
  duplicate_group_id UUID REFERENCES public.global_duplicate_groups(id),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  affected_properties UUID[] NOT NULL DEFAULT '{}',
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Merged properties tracking (to prevent re-import)
CREATE TABLE public.merged_properties_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_property_id UUID NOT NULL, -- The original property that was merged
  target_property_id UUID REFERENCES public.properties(id) NOT NULL, -- The property it was merged into
  merge_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  merged_by UUID REFERENCES auth.users(id) NOT NULL,
  original_data JSONB NOT NULL, -- Store original property data for reference
  merge_reason TEXT,
  fingerprint TEXT NOT NULL -- Unique identifier to prevent re-import
);

-- Enable RLS on all tables
ALTER TABLE public.global_duplicate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_duplicate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merged_properties_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin-only access
CREATE POLICY "Admins can manage duplicate groups"
ON public.global_duplicate_groups
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage duplicate properties"
ON public.global_duplicate_properties
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view detection logs"
ON public.duplicate_detection_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view merged properties tracking"
ON public.merged_properties_tracking
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX idx_global_duplicate_groups_status ON public.global_duplicate_groups(status);
CREATE INDEX idx_global_duplicate_groups_confidence ON public.global_duplicate_groups(confidence_score);
CREATE INDEX idx_global_duplicate_properties_group ON public.global_duplicate_properties(duplicate_group_id);
CREATE INDEX idx_duplicate_detection_log_admin ON public.duplicate_detection_log(admin_user_id);
CREATE INDEX idx_merged_properties_fingerprint ON public.merged_properties_tracking(fingerprint);

-- Add triggers for timestamps
CREATE TRIGGER update_global_duplicate_groups_updated_at
BEFORE UPDATE ON public.global_duplicate_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate property fingerprint (for duplicate prevention)
CREATE OR REPLACE FUNCTION public.generate_property_fingerprint(
  p_title TEXT,
  p_street_name TEXT,
  p_street_number TEXT,
  p_zip_code TEXT,
  p_city TEXT,
  p_monthly_rent DECIMAL,
  p_bedrooms INTEGER,
  p_square_meters DECIMAL
) RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT md5(
    COALESCE(lower(trim(p_title)), '') || '|' ||
    COALESCE(lower(trim(p_street_name)), '') || '|' ||
    COALESCE(lower(trim(p_street_number)), '') || '|' ||
    COALESCE(lower(trim(p_zip_code)), '') || '|' ||
    COALESCE(lower(trim(p_city)), '') || '|' ||
    COALESCE(p_monthly_rent::text, '0') || '|' ||
    COALESCE(p_bedrooms::text, '0') || '|' ||
    COALESCE(p_square_meters::text, '0')
  )
$$;