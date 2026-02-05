-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "HR can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "HR can view all interviews" ON public.interviews;
DROP POLICY IF EXISTS "HR can view all interview reports" ON public.interview_reports;
DROP POLICY IF EXISTS "HR can view all interview messages" ON public.interview_messages;

-- Create a function to check if user is HR/Admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_hr_or_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = user_uuid AND role IN ('admin', 'hr')
  );
$$;

-- Recreate HR policies using the function
CREATE POLICY "HR can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_hr_or_admin(auth.uid()));

CREATE POLICY "HR can view all interviews"
ON public.interviews
FOR SELECT
USING (public.is_hr_or_admin(auth.uid()));

CREATE POLICY "HR can view all interview reports"
ON public.interview_reports
FOR SELECT
USING (public.is_hr_or_admin(auth.uid()));

CREATE POLICY "HR can view all interview messages"
ON public.interview_messages
FOR SELECT
USING (public.is_hr_or_admin(auth.uid()));