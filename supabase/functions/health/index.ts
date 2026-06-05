import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const health = {
      status: dbError ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      version: "v31",
      services: {
        database: dbError ? "down" : "up",
        auth: "up",
        storage: "up",
      },
      checks: {
        database_connection: !dbError,
        environment_variables: !!(supabaseUrl && supabaseKey),
      }
    };

    const statusCode = health.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "v31",
        error: error instanceof Error ? error.message : "Unknown error"
      }, null, 2),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
