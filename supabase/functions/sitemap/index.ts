import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://www.tutorspool.com";
const FIREBASE_PROJECT_ID = "tutorspooldb";

const LANGS = ["en", "ar", "es"];

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/subjects", priority: "0.9", changefreq: "weekly" },
  { path: "/tutors", priority: "0.9", changefreq: "weekly" },
  { path: "/group-classes", priority: "0.9", changefreq: "weekly" },
  { path: "/courses", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews", priority: "0.8", changefreq: "weekly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/careers", priority: "0.5", changefreq: "monthly" },
  { path: "/disclaimer", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function altLinks(path: string) {
  return (
    LANGS.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${path}${l === "en" ? "" : `?lng=${l}`}"/>`,
    ).join("\n") +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}"/>`
  );
}

async function runQuery(collectionId: string, filter?: { field: string; value: any }) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
    const structuredQuery: any = { from: [{ collectionId }] };
    if (filter) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: filter.field },
          op: "EQUAL",
          value: filter.value,
        },
      };
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((item: any) => item.document);
  } catch (e) {
    console.error(`Error fetching ${collectionId}:`, e);
    return [];
  }
}

function docId(item: any) {
  return String(item.document.name).split("/").pop() || "";
}

function lastmodOf(item: any, fields: string[]) {
  const f = item.document.fields || {};
  for (const key of fields) {
    const ts = f[key]?.timestampValue;
    if (ts) return String(ts).split("T")[0];
  }
  return undefined;
}

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
  const [blogPosts, tutors, courses, groupPackages] = await Promise.all([
    fetchPublishedBlogPosts(),
    runQuery("tutorProfiles", { field: "isApproved", value: { booleanValue: true } }),
    runQuery("courses", { field: "status", value: { stringValue: "published" } }),
    runQuery("groupPackages", { field: "status", value: { stringValue: "approved" } }),
  ]);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  for (const route of staticRoutes) {
    xml += `  <url>
    <loc>${SITE_URL}${route.path}</loc>
${altLinks(route.path)}
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

  const dynamicGroups: { items: any[]; prefix: string; priority: string; changefreq: string; lastmodFields: string[] }[] = [
    { items: tutors, prefix: "/tutors/", priority: "0.7", changefreq: "weekly", lastmodFields: ["updatedAt"] },
    { items: courses, prefix: "/courses/", priority: "0.8", changefreq: "weekly", lastmodFields: ["updatedAt", "publishedAt"] },
    { items: groupPackages, prefix: "/group-classes/", priority: "0.7", changefreq: "weekly", lastmodFields: ["updatedAt"] },
  ];

  for (const group of dynamicGroups) {
    for (const item of group.items) {
      const id = docId(item);
      if (!id) continue;
      const lastmod = lastmodOf(item, group.lastmodFields);
      xml += `  <url>
    <loc>${SITE_URL}${group.prefix}${id}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${group.changefreq}</changefreq>
    <priority>${group.priority}</priority>
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
