// Email open + click tracker.
// GET /email-track?e=<eventId>&t=open                  -> 1x1 gif
// GET /email-track?e=<eventId>&t=click&u=<encoded-url> -> 302 redirect
//
// Writes one doc per event to the `emailEvents` Firestore collection.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createDoc, getDoc } from "../_shared/firestore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

async function logEvent(eventId: string, type: string, meta: Record<string, unknown>) {
  try {
    const src = await getDoc(`emailLog/${eventId}`);
    await createDoc("emailEvents", {
      trackingId: eventId,
      userId: src?.data?.userId ?? null,
      role: src?.data?.role ?? null,
      kind: src?.data?.kind ?? null,
      event: type,
      at: new Date().toISOString(),
      meta,
    });
  } catch (err) {
    console.error("[email-track] log failed", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const eventId = url.searchParams.get("e") || "";
  const type = url.searchParams.get("t") || "open";
  const target = url.searchParams.get("u");
  const ua = req.headers.get("user-agent") || "";
  const ref = req.headers.get("referer") || "";

  // Fire-and-forget log (don't block the redirect / pixel)
  if (eventId) {
    logEvent(eventId, type === "click" ? "click" : "open", { ua, ref, url: target ?? null });
  }

  if (type === "click" && target) {
    try {
      const dest = decodeURIComponent(target);
      return new Response(null, {
        status: 302,
        headers: { Location: dest, "Cache-Control": "no-store" },
      });
    } catch {
      return new Response("Invalid url", { status: 400 });
    }
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Content-Length": String(PIXEL.byteLength),
    },
  });
});
