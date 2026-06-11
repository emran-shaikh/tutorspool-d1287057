// Public one-click unsubscribe endpoint for lifecycle emails.
// Usage: GET /email-unsubscribe?uid=<uid>&token=<hmac>
// Also supports POST for RFC 8058 (List-Unsubscribe-Post: List-Unsubscribe=One-Click).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { patchDoc, getDoc, createDoc } from "../_shared/firestore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECRET = Deno.env.get("ADMIN_SECURITY_KEY") || "fallback-secret";

async function expectedToken(uid: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uid));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function htmlResponse(body: string, status = 200) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TutorsPool</title>
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <style>body{font-family:system-ui,sans-serif;background:#f1f5f9;margin:0;padding:60px 20px;text-align:center;color:#0f172a}
     .card{max-width:480px;margin:0 auto;background:#fff;padding:40px 32px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.08)}
     h1{margin:0 0 12px;font-size:22px}a{color:#F97316;text-decoration:none;font-weight:600}</style></head>
     <body><div class="card">${body}<p style="margin-top:24px"><a href="https://tutorspool.com">← Back to TutorsPool</a></p></div></body></html>`,
    { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const token = url.searchParams.get("token");
    if (!uid || !token) return htmlResponse("<h1>Invalid link</h1><p>Missing parameters.</p>", 400);

    const expected = await expectedToken(uid);
    if (token !== expected) return htmlResponse("<h1>Invalid link</h1><p>This unsubscribe link is invalid or expired.</p>", 400);

    const user = await getDoc(`users/${uid}`);
    if (!user) return htmlResponse("<h1>Account not found</h1>", 404);

    await patchDoc(`users/${uid}`, {
      emailPreferences: {
        ...(user.data.emailPreferences ?? {}),
        lifecycle: false,
        unsubscribedAt: new Date().toISOString(),
      },
    }, ["emailPreferences"]);

    // Analytics: log unsubscribe event (no trackingId — global opt-out)
    await createDoc("emailEvents", {
      trackingId: null,
      userId: uid,
      role: user.data.role ?? null,
      kind: "lifecycle",
      event: "unsubscribe",
      at: new Date().toISOString(),
      meta: {},
    }).catch((e) => console.error("emailEvents unsubscribe log failed", e));

    return htmlResponse("<h1>You're unsubscribed ✅</h1><p>You won't receive any more lifecycle reminder emails. Important account emails (sessions, security) will still be sent.</p>");
  } catch (err) {
    console.error("[email-unsubscribe] ERROR", err);
    return htmlResponse("<h1>Something went wrong</h1><p>Please try again later.</p>", 500);
  }
});
