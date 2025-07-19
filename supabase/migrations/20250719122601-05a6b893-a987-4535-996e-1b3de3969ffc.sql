-- Add missing property detail columns to properties table
ALTER TABLE public.properties
ADD COLUMN bedrooms integer DEFAULT 0,
ADD COLUMN bathrooms integer DEFAULT 0,
ADD COLUMN max_guests integer DEFAULT 0,
ADD COLUMN square_meters numeric DEFAULT 0;