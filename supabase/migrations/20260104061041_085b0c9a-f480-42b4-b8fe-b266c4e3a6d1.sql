-- Rename columns in agentbuddy_connections for API key auth
ALTER TABLE public.agentbuddy_connections 
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at,
  DROP COLUMN IF EXISTS scopes;

-- Rename access_token to api_key for clarity
ALTER TABLE public.agentbuddy_connections 
  RENAME COLUMN access_token TO api_key;