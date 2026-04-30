import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIREBASE_PROJECT_ID = "tutorspooldb";

let wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasmRes = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
      const wasmBytes = await wasmRes.arrayBuffer();
      await initWasm(wasmBytes);
    })();
  }
  return wasmReady;
}

function getVal(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map((v: any) => getVal(v));
  }
  return null;
}

async function findBlogBySlug(slug: string) {
  // Use Firestore REST :runQuery to find by slug
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "blogPosts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.find((d: any) => d.document)?.document;
  return doc?.fields || null;
}

async function fetchImageAsDataUri(src: string): Promise<string | null> {
  try {
    if (src.startsWith("data:")) return src;
    const res = await fetch(src);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = new Uint8Array(await res.arrayBuffer());
    // Base64 encode
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

function generateBlogOG(opts: {
  title: string;
  author: string;
  tags: string[];
  coverDataUri: string | null;
}): string {
  const { title, author, tags, coverDataUri } = opts;
  const titleLines = wrapText(title, 32, 3);
  const tagsText = tags.slice(0, 4).map((t) => `#${t}`).join("  ");

  const coverBlock = coverDataUri
    ? `<clipPath id="coverClip"><rect x="660" y="80" width="480" height="470" rx="20"/></clipPath>
       <image href="${coverDataUri}" x="660" y="80" width="480" height="470" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>`
    : `<rect x="660" y="80" width="480" height="470" rx="20" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.3)" stroke-width="2"/>
       <text x="900" y="320" font-family="Arial, sans-serif" font-size="120" text-anchor="middle">📚</text>`;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#fb923c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="80" cy="560" r="180" fill="rgba(249,115,22,0.06)"/>
  <circle cx="1150" cy="60" r="140" fill="rgba(249,115,22,0.05)"/>

  <rect x="60" y="50" width="42" height="42" rx="10" fill="url(#accent)"/>
  <text x="115" y="80" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white">TutorsPool</text>
  <text x="295" y="80" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Blog</text>

  <text x="60" y="160" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fb923c" letter-spacing="2">ARTICLE</text>

  ${titleLines
    .map(
      (line, i) =>
        `<text x="60" y="${215 + i * 56}" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="white">${escapeXml(line)}</text>`
    )
    .join("\n  ")}

  <text x="60" y="${215 + titleLines.length * 56 + 35}" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)">By ${escapeXml(author)}</text>
  ${
    tagsText
      ? `<text x="60" y="${215 + titleLines.length * 56 + 65}" font-family="Arial, sans-serif" font-size="15" fill="#fb923c">${escapeXml(tagsText)}</text>`
      : ""
  }

  <rect x="60" y="555" width="200" height="40" rx="20" fill="url(#accent)"/>
  <text x="160" y="581" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">Read Article →</text>

  ${coverBlock}
</svg>`;
}

function fallbackSVG(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0f172a"/><stop offset="100%" style="stop-color:#1e293b"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="300" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">TutorsPool Blog</text>
  <text x="600" y="370" font-family="Arial, sans-serif" font-size="22" fill="#fb923c" text-anchor="middle">Insights for students, tutors and parents</text>
</svg>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      const png = await svgToPng(fallbackSVG());
      return new Response(png, { headers: { ...corsHeaders, "Content-Type": "image/png" } });
    }

    const fields = await findBlogBySlug(slug);
    if (!fields) {
      const png = await svgToPng(fallbackSVG());
      return new Response(png, {
        headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=600" },
      });
    }

    const title = getVal(fields.title) || "TutorsPool Blog";
    const author = getVal(fields.authorName) || "TutorsPool";
    const tags = (getVal(fields.tags) as string[] | null) || [];
    const coverImage = getVal(fields.coverImage);

    const coverDataUri = coverImage ? await fetchImageAsDataUri(coverImage) : null;

    const svg = generateBlogOG({ title, author, tags, coverDataUri });
    const png = await svgToPng(svg);

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("og-blog error:", e);
    try {
      const png = await svgToPng(fallbackSVG());
      return new Response(png, { headers: { ...corsHeaders, "Content-Type": "image/png" } });
    } catch {
      return new Response(fallbackSVG(), { headers: { ...corsHeaders, "Content-Type": "image/svg+xml" } });
    }
  }
});
