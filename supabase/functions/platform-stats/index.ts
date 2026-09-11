import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { listDocs } from "../_shared/firestore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache to avoid heavy Firestore scans on every page load
let cache: { body: Record<string, number>; at: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cache.body), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [users, tutorProfiles, reviews] = await Promise.all([
      listDocs("users"),
      listDocs("tutorProfiles"),
      listDocs("reviews"),
    ]);

    const studentCount = users.filter((u) => u.data.role === "student").length;

    const approvedTutors = tutorProfiles.filter((t) => t.data.isApproved === true);
    const subjects = new Set<string>();
    for (const t of approvedTutors) {
      const list = Array.isArray(t.data.subjects) ? t.data.subjects : [];
      for (const s of list) subjects.add(s);
    }

    const ratings = reviews
      .map((r) => Number(r.data.rating))
      .filter((n) => !isNaN(n) && n > 0);
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    const body = {
      tutorCount: approvedTutors.length,
      studentCount,
      subjectCount: subjects.size,
      reviewCount: reviews.length,
      avgRating,
    };

    cache = { body, at: Date.now() };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
