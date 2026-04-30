// Server-side rendered OG meta tags for blog posts and quiz results.
// Social crawlers (Facebook/WhatsApp/X/LinkedIn) don't run JS, so we serve
// HTML with the right meta tags. Real users get redirected to the SPA.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = "tutorspooldb";
const SUPABASE_URL = "https://yafjkpckhzpkrptmzcms.supabase.co";
const SITE_URL = "https://tutorspool.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function findBlogBySlug(slug: string) {
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

async function getQuizResult(resultId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/quizResults/${resultId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.fields || null;
}

function isCrawler(ua: string): boolean {
  const u = ua.toLowerCase();
  return /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|pinterest|redditbot|skypeuripreview|googlebot|bingbot|applebot|embedly|quora link preview|outbrain|vkshare|w3c_validator)/i.test(u);
}

function htmlShell(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}): string {
  const { title, description, image, url, type = "article" } = opts;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const u = escapeHtml(url);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${u}" />

<meta property="og:type" content="${type}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:secure_url" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="${t}" />
<meta property="og:url" content="${u}" />
<meta property="og:site_name" content="TutorsPool" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />

<meta http-equiv="refresh" content="0; url=${u}" />
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">Continue to ${t}</a></p>
<script>window.location.replace(${JSON.stringify(url)});</script>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const ua = req.headers.get("user-agent") || "";
    const crawler = isCrawler(ua);

    // Real users: redirect immediately to the SPA route
    const targetUrl = `${SITE_URL}${path}`;
    if (!crawler) {
      return Response.redirect(targetUrl, 302);
    }

    // Blog post: /blog/:slug
    const blogMatch = path.match(/^\/blog\/([^/?#]+)/);
    if (blogMatch) {
      const slug = decodeURIComponent(blogMatch[1]);
      const fields = await findBlogBySlug(slug);
      if (fields) {
        const title = getVal(fields.metaTitle) || getVal(fields.title) || "TutorsPool Blog";
        const desc = getVal(fields.metaDescription) || getVal(fields.excerpt) || "Read on TutorsPool";
        const ogImage = `${SUPABASE_URL}/functions/v1/og-blog?slug=${encodeURIComponent(slug)}`;
        return new Response(
          htmlShell({ title, description: desc, image: ogImage, url: targetUrl, type: "article" }),
          { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } }
        );
      }
    }

    // Shared quiz results: /shared-results/:id
    const resultMatch = path.match(/^\/shared-results\/([^/?#]+)/);
    if (resultMatch) {
      const id = decodeURIComponent(resultMatch[1]);
      const fields = await getQuizResult(id);
      const score = fields ? getVal(fields.score) : null;
      const total = fields ? getVal(fields.totalQuestions) || getVal(fields.total) : null;
      const studentName = fields ? getVal(fields.studentName) || "A student" : "A student";
      const title = score != null && total != null
        ? `${studentName} scored ${score}/${total} on TutorsPool!`
        : "Quiz Achievement on TutorsPool";
      const desc = "Check out this learning achievement powered by SmartGen™ by TutorsPool.";
      const ogImage = `${SUPABASE_URL}/functions/v1/og-quiz-result?id=${encodeURIComponent(id)}`;
      return new Response(
        htmlShell({ title, description: desc, image: ogImage, url: targetUrl, type: "article" }),
        { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } }
      );
    }

    // Fallback: generic site card
    return new Response(
      htmlShell({
        title: "TutorsPool - Transform Your Learning Journey",
        description: "Connect with world-class tutors for personalized 1-on-1 sessions.",
        image: `${SITE_URL}/icon.png`,
        url: targetUrl,
        type: "website",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("og-meta error:", e);
    return new Response("OK", { headers: { "Content-Type": "text/plain" } });
  }
});
