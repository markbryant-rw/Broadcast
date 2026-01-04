import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key, team_id, scopes } = await req.json();

    if (!api_key || !team_id) {
      console.error('Missing required fields:', { hasApiKey: !!api_key, hasTeamId: !!team_id });
      return new Response(
        JSON.stringify({ error: 'Missing api_key or team_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Storing AgentBuddy connection for team:', team_id);

    // Use service role to store the connection
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find the organization by team_id (assuming team_id maps to organization.id)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', team_id)
      .maybeSingle();

    if (orgError) {
      console.error('Error finding organization:', orgError);
      return new Response(
        JSON.stringify({ error: 'Failed to find organization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!org) {
      console.error('Organization not found:', team_id);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert the connection (update if exists, insert if not)
    const { error: upsertError } = await supabaseAdmin
      .from('agentbuddy_connections')
      .upsert(
        {
          organization_id: team_id,
          api_key,
          scopes: scopes || [],
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );

    if (upsertError) {
      console.error('Error storing connection:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store connection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully stored AgentBuddy connection for team:', team_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
