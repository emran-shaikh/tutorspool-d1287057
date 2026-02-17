import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://tutorspool.lovable.app";
const FIREBASE_PROJECT_ID = "tutorspooldb";

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/subjects", priority: "0.9", changefreq: "weekly" },
  { path: "/tutors", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews", priority: "0.8", changefreq: "weekly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/careers", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/login", priority: "0.4", changefreq: "monthly" },
  { path: "/register", priority: "0.4", changefreq: "monthly" },
];

async function fetchPublishedBlogPosts() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: "blogPosts" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "isPublished" },
            op: "EQUAL",
            value: { booleanValue: true },
          },
        },
        orderBy: [{ field: { fieldPath: "publishedAt" }, direction: "DESCENDING" }],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    return data
      .filter((item: any) => item.document)
      .map((item: any) => {
        const fields = item.document.fields;
        const slug = fields.slug?.stringValue || "";
        const updatedAt = fields.updatedAt?.timestampValue || fields.publishedAt?.timestampValue || new Date().toISOString();
        return { slug, updatedAt };
      });
  } catch (e) {
    console.error("Error fetching blog posts:", e);
    return [];
  }
}

serve(async () => {
  const blogPosts = await fetchPublishedBlogPosts();
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const route of staticRoutes) {
    xml += `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  }

  for (const post of blogPosts) {
    if (post.slug) {
      const lastmod = post.updatedAt.split("T")[0];
      xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
