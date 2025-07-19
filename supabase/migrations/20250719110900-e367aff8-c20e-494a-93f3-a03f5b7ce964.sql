-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  apartment_type TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, synced
  
  -- Address
  street_number TEXT,
  street_name TEXT,
  zip_code TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Germany',
  
  -- Rental fees
  monthly_rent DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  
  -- Terms
  checkin_time TIME,
  checkout_time TIME,
  
  -- Legal
  landlord_info JSONB,
  contractual_partner JSONB,
  provides_wgsb BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create policies for properties
CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create property fees table for additional fees
CREATE TABLE public.property_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL, -- monthly, weekly, one-time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_fees
ALTER TABLE public.property_fees ENABLE ROW LEVEL SECURITY;

-- Create policies for property_fees
CREATE POLICY "Users can manage fees for their properties" 
ON public.property_fees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_fees.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Create property media table
CREATE TABLE public.property_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  category TEXT,
  media_type TEXT NOT NULL, -- image, video
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_media
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

-- Create policies for property_media
CREATE POLICY "Users can manage media for their properties" 
ON public.property_media 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_media.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Create sync status table
CREATE TABLE public.property_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- farawayhome, immoscout24, airbnb, etc.
  status TEXT NOT NULL, -- synced, failed, pending
  last_synced TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, platform)
);

-- Enable RLS on property_sync_status
ALTER TABLE public.property_sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies for property_sync_status
CREATE POLICY "Users can manage sync status for their properties" 
ON public.property_sync_status 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_sync_status.property_id 
    AND properties.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_sync_status_updated_at
BEFORE UPDATE ON public.property_sync_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();