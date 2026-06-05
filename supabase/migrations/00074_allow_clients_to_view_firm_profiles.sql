-- Allow clients to view profiles in their firm
-- This enables clients to see names of project managers, staff, etc.

CREATE POLICY "Clients can view profiles in their firm"
ON profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'client') 
  AND firm_id = get_user_firm_id(auth.uid())
);