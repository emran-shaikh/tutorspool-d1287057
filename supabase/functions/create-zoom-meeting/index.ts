import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token by decoding and checking expiry
// Firebase tokens are JWTs - we verify the structure and expiry
async function verifyFirebaseToken(token: string): Promise<{ valid: boolean; uid?: string }> {
  try {
    // Decode the JWT payload (middle part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    // Decode base64url payload
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('Token expired');
      return { valid: false };
    }
    
    // Check issuer (should be Firebase project)
    if (!decoded.iss || !decoded.iss.includes('securetoken.google.com')) {
      console.log('Invalid issuer:', decoded.iss);
      return { valid: false };
    }
    
    // Token structure is valid
    return { valid: true, uid: decoded.user_id || decoded.sub };
  } catch (error) {
    console.error('Token decode error:', error);
    return { valid: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Firebase authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validate token format (Firebase tokens are JWTs with 3 parts)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3 || token.length < 100) {
      console.log('Invalid token format');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the Firebase token
    const tokenResult = await verifyFirebaseToken(token);
    if (!tokenResult.valid) {
      console.log('Firebase token validation failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firebase token validated successfully, uid:', tokenResult.uid);
    const { topic, startTime, duration } = await req.json();
    
    const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
    const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');
    const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID');

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom credentials not configured');
    }

    // Get access token using Server-to-Server OAuth
    const tokenBody = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
    });
    
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token error:', errorText);
      throw new Error('Failed to get Zoom access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create the meeting
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic || 'Tutoring Session',
        type: 2, // Scheduled meeting
        start_time: startTime || new Date().toISOString(),
        duration: duration || 60,
        timezone: 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          waiting_room: false,
          auto_recording: 'none',
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errorText = await meetingResponse.text();
      console.error('Meeting creation error:', errorText);
      throw new Error('Failed to create Zoom meeting');
    }

    const meetingData = await meetingResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        meetingId: meetingData.id,
        joinUrl: meetingData.join_url,
        startUrl: meetingData.start_url,
        password: meetingData.password,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});