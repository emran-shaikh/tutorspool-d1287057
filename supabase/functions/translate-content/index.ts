// Translate arbitrary user-generated text via Lovable AI, cached in Firestore.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { firestoreGet, firestoreSet } from "../_shared/firestore.ts";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, targetLang, cacheKey } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = (targetLang || "en").toLowerCase();
    if (!LANG_NAMES[lang]) {
      return new Response(JSON.stringify({ error: "unsupported language" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lang === "en") {
      return new Response(JSON.stringify({ translated: text, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyBase = cacheKey || (await sha256Hex(text)).slice(0, 24);
    const docId = await sha256Hex(`${keyBase}::${lang}`);

    // 1. Firestore cache lookup
    try {
      const existing = await firestoreGet(`translations/${docId}`);
      if (existing?.fields?.text?.stringValue) {
        return new Response(
          JSON.stringify({ translated: existing.fields.text.stringValue, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch (_) {
      // ignore, will translate fresh
    }

    // 2. Translate via Lovable AI
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You are a professional translator. Translate the user's text into ${LANG_NAMES[lang]}. ` +
              "Preserve meaning, tone, proper nouns, brand names, numbers, URLs, and formatting (line breaks, markdown). " +
              "Return ONLY the translated text — no preamble, no quotes, no explanation.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(
        JSON.stringify({ error: "AI gateway error", detail: errText, status: aiRes.status }),
        {
          status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiJson = await aiRes.json();
    const translated: string = aiJson?.choices?.[0]?.message?.content?.trim() || "";
    if (!translated) {
      return new Response(JSON.stringify({ error: "Empty translation" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Cache in Firestore (best-effort)
    try {
      await firestoreSet(`translations/${docId}`, {
        text: translated,
        lang,
        cacheKey: keyBase,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("translation cache write failed", e);
    }

    return new Response(JSON.stringify({ translated, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
