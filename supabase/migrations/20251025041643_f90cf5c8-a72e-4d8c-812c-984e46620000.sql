-- Create table for solar scenarios
CREATE TABLE public.solar_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  area NUMERIC NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  system_capacity NUMERIC NOT NULL,
  peak_power NUMERIC NOT NULL,
  energy_output NUMERIC NOT NULL,
  annual_revenue NUMERIC NOT NULL,
  roi_period NUMERIC NOT NULL,
  co2_reduction NUMERIC NOT NULL,
  project_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solar_scenarios ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read scenarios (public app)
CREATE POLICY "Scenarios are viewable by everyone" 
ON public.solar_scenarios 
FOR SELECT 
USING (true);

-- Allow anyone to create scenarios
CREATE POLICY "Anyone can create scenarios" 
ON public.solar_scenarios 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete scenarios
CREATE POLICY "Anyone can delete scenarios" 
ON public.solar_scenarios 
FOR DELETE 
USING (true);