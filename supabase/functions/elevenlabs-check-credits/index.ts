import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
      return new Response(JSON.stringify({ has_credits: false, error: "Missing config" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`ElevenLabs credit check failed [${response.status}]: ${errorText}`);
      return new Response(JSON.stringify({ has_credits: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success means credits are available
    console.log("ElevenLabs credit check: credits available");
    return new Response(JSON.stringify({ has_credits: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Credit check error:", error);
    return new Response(JSON.stringify({ has_credits: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
