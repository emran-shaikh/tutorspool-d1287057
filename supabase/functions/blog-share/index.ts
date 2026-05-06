import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = "tutorspooldb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getVal(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  return null;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function findBlogBySlug(slug: string) {
  // Use Firestore REST runQuery to find post by slug
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
  const doc = Array.isArray(data) ? data.find((d: any) => d.document) : null;
  return doc?.document?.fields || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug") || url.pathname.split("/").pop();
    if (!slug) return new Response("Missing slug", { status: 400 });

    const fields = await findBlogBySlug(slug);

    const targetUrl = `https://tutorspool.com/blog/${slug}`;
    const title = escapeHtml(getVal(fields?.metaTitle) || getVal(fields?.title) || "TutorsPool Blog");
    const description = escapeHtml(
      getVal(fields?.metaDescription) || getVal(fields?.excerpt) || "Read this article on TutorsPool"
    );
    const image =
      getVal(fields?.coverImage) ||
      "https://tutorspool.com/icon.png";

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${targetUrl}" />

<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${targetUrl}" />
<meta property="og:site_name" content="TutorsPool" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<meta http-equiv="refresh" content="0; url=${targetUrl}" />
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
<p>Redirecting to <a href="${targetUrl}">${title}</a>…</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e) {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
