-- Migrate agentbuddy_connections from user-level to organization-level

-- 1. Add organization_id and scopes columns
ALTER TABLE public.agentbuddy_connections 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS scopes text[] DEFAULT '{}';

-- 2. Make user_id nullable (old connections had user_id, new ones will have organization_id)
ALTER TABLE public.agentbuddy_connections 
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add unique constraint on organization_id (one connection per org)
ALTER TABLE public.agentbuddy_connections 
  ADD CONSTRAINT agentbuddy_connections_organization_id_key UNIQUE (organization_id);

-- 4. Drop old user-based RLS policies
DROP POLICY IF EXISTS "Users can delete own connections" ON public.agentbuddy_connections;
DROP POLICY IF EXISTS "Users can insert own connections" ON public.agentbuddy_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.agentbuddy_connections;
DROP POLICY IF EXISTS "Users can view own connections" ON public.agentbuddy_connections;

-- 5. Create new org-based RLS policies
CREATE POLICY "Org members can view their org connections"
  ON public.agentbuddy_connections FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert org connections"
  ON public.agentbuddy_connections FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update org connections"
  ON public.agentbuddy_connections FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete org connections"
  ON public.agentbuddy_connections FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id));

-- 6. Allow service role to upsert (for the edge function)
CREATE POLICY "Service role can manage all connections"
  ON public.agentbuddy_connections FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');