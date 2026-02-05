-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('admin', 'hr', 'interviewer', 'candidate')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- HR and Admin can view all profiles
CREATE POLICY "HR can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'hr')
  )
);

-- Allow public insert for profile creation during signup
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow anonymous interviews (for candidates without accounts)
-- Update interviews table to allow null user_id properly
CREATE POLICY "Allow anonymous interview creation"
ON public.interviews
FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Allow anonymous interview updates"  
ON public.interviews
FOR UPDATE
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Allow anonymous interview viewing"
ON public.interviews
FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

-- HR can view all interviews
CREATE POLICY "HR can view all interviews"
ON public.interviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'hr')
  )
);

-- HR can view all reports
CREATE POLICY "HR can view all interview reports"
ON public.interview_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'hr')
  )
);

-- HR can view all messages
CREATE POLICY "HR can view all interview messages"
ON public.interview_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'hr')
  )
);

-- Allow service role to insert reports (for edge functions)
CREATE POLICY "Service role can insert reports"
ON public.interview_reports
FOR INSERT
WITH CHECK (true);

-- Allow service role to update reports
CREATE POLICY "Service role can update reports"
ON public.interview_reports
FOR UPDATE
USING (true);

-- Allow anonymous message creation for candidates
CREATE POLICY "Allow anonymous message creation"
ON public.interview_messages
FOR INSERT
WITH CHECK (true);

-- Allow anonymous message viewing  
CREATE POLICY "Allow anonymous message viewing"
ON public.interview_messages
FOR SELECT
USING (true);