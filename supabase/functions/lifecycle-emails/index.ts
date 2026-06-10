// Lifecycle email cron worker.
// Runs hourly. Evaluates rules, sends nudges via send-email, writes emailLog.
//
// Manual trigger: POST with body { dryRun?: boolean, only?: string[] } to test.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { listDocs, runQuery, createDoc, getDoc } from "../_shared/firestore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://tutorspool.com";
const UNSUB_SECRET = Deno.env.get("ADMIN_SECURITY_KEY") || "fallback-secret";

const ROLE_THEMES: Record<string, { headline: (n: string) => string }> = {
  student: { headline: (n) => `Hi ${n},` },
  tutor: { headline: (n) => `Hi ${n},` },
  parent: { headline: (n) => `Hi ${n},` },
};

// ── helpers ─────────────────────────────────────────────────────────────

function daysSince(iso?: string | null): number {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

async function hmacToken(uid: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uid));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function unsubUrl(uid: string): Promise<string> {
  const token = await hmacToken(uid);
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?uid=${uid}&token=${token}`;
}

interface EmailLogEntry { userId: string; kind: string; sentAt: string; }

async function getRecentLogs(userId: string, sinceDays = 7): Promise<EmailLogEntry[]> {
  const cutoff = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const docs = await runQuery("emailLog", [
    { field: "userId", op: "EQUAL", value: userId },
    { field: "sentAt", op: "GREATER_THAN", value: { __ts: cutoff } as any },
  ], 50).catch(() => [] as any[]);
  // Fallback: simple userId filter, sort client-side (composite index may not exist)
  if (docs.length === 0) {
    const all = await runQuery("emailLog", [{ field: "userId", op: "EQUAL", value: userId }], 50).catch(() => []);
    return all.map((d) => d.data as EmailLogEntry).filter((e) => e.sentAt >= cutoff);
  }
  return docs.map((d) => d.data as EmailLogEntry);
}

async function shouldSend(userId: string, kind: string, maxPerKind: number, gapDays: number): Promise<boolean> {
  const logs = await getRecentLogs(userId, 30);
  // 48h suppression across ALL lifecycle kinds
  const since48h = new Date(Date.now() - 2 * 86400000).toISOString();
  if (logs.some((l) => l.sentAt >= since48h)) return false;
  // weekly cap: 2 lifecycle emails per 7d
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  if (logs.filter((l) => l.sentAt >= since7d).length >= 2) return false;
  // per-kind cap + gap
  const ofKind = logs.filter((l) => l.kind === kind);
  if (ofKind.length >= maxPerKind) return false;
  if (ofKind.length > 0) {
    const lastSent = ofKind.map((l) => new Date(l.sentAt).getTime()).sort().pop()!;
    if (Date.now() - lastSent < gapDays * 86400000) return false;
  }
  return true;
}

async function sendLifecycle(opts: {
  userId: string; to: string; role: "student" | "tutor" | "parent";
  kind: string; subject: string; headline: string; bodyHtml: string;
  ctaUrl: string; ctaLabel: string;
}): Promise<void> {
  const unsub = await unsubUrl(opts.userId);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      type: "lifecycle", to: opts.to, role: opts.role,
      subject: opts.subject, headline: opts.headline, bodyHtml: opts.bodyHtml,
      ctaUrl: opts.ctaUrl, ctaLabel: opts.ctaLabel, unsubscribeUrl: unsub,
    }),
  });
  if (!res.ok) throw new Error(`send-email failed: ${await res.text()}`);
  await createDoc("emailLog", { userId: opts.userId, kind: opts.kind, sentAt: new Date().toISOString(), status: "sent" });
}

// ── Rules ───────────────────────────────────────────────────────────────

async function evalTutorRules(dryRun: boolean, only: string[]): Promise<string[]> {
  const out: string[] = [];
  const tutors = await runQuery("users", [{ field: "role", op: "EQUAL", value: "tutor" }], 1000);
  for (const u of tutors) {
    const uid = u.id;
    const data = u.data;
    if (data.emailPreferences?.lifecycle === false) continue;
    const created = data.createdAt;
    const sinceReg = daysSince(typeof created === "string" ? created : null);

    // Rule: tutor_profile_incomplete (Day 1, 3, 7, then weekly, max 4)
    if (only.length === 0 || only.includes("tutor_profile_incomplete")) {
      const profile = await getDoc(`tutorProfiles/${uid}`);
      const p = profile?.data ?? {};
      const missing: string[] = [];
      if (!p.photoURL) missing.push("Profile photo");
      if (!Array.isArray(p.subjects) || p.subjects.length === 0) missing.push("Subjects");
      if (!p.bio || (p.bio + "").length < 20) missing.push("Bio");
      if (!p.hourlyRate) missing.push("Hourly rate");
      if (missing.length > 0 && sinceReg >= 1) {
        const ok = await shouldSend(uid, "tutor_profile_incomplete", 4, 3);
        if (ok) {
          out.push(`tutor_profile_incomplete → ${data.email}`);
          if (!dryRun) await sendLifecycle({
            userId: uid, to: data.email, role: "tutor",
            kind: "tutor_profile_incomplete",
            subject: "Finish your tutor profile to start receiving students",
            headline: "Complete Your Profile",
            bodyHtml: `<p>Hi <strong>${data.fullName}</strong>,</p>
              <p>You're almost there — finish these to get approved faster and start receiving students:</p>
              <ul style="padding-left:20px;color:#334155;">${missing.map((m) => `<li>${m}</li>`).join("")}</ul>
              <p>It takes under 2 minutes.</p>`,
            ctaUrl: `${SITE}/tutor/profile`, ctaLabel: "Complete Profile",
          });
        }
      }
    }

    // Rule: tutor_inactive — no login in 14d (use lastSeenAt if present; fallback to createdAt heuristic skipped)
    if (only.length === 0 || only.includes("tutor_inactive")) {
      const lastSeen = data.lastSeenAt;
      if (lastSeen && daysSince(lastSeen) >= 14) {
        const ok = await shouldSend(uid, "tutor_inactive", 3, 14);
        if (ok) {
          out.push(`tutor_inactive → ${data.email}`);
          if (!dryRun) await sendLifecycle({
            userId: uid, to: data.email, role: "tutor",
            kind: "tutor_inactive",
            subject: "Your students miss you — log back in",
            headline: "We Miss You!",
            bodyHtml: `<p>Hi <strong>${data.fullName}</strong>,</p>
              <p>It's been a while. New students are looking for tutors in your subjects — sign in to accept session requests and keep your profile visible.</p>`,
            ctaUrl: `${SITE}/tutor/dashboard`, ctaLabel: "Open Dashboard",
          });
        }
      }
    }
  }
  return out;
}

async function evalStudentRules(dryRun: boolean, only: string[]): Promise<string[]> {
  const out: string[] = [];
  const students = await runQuery("users", [{ field: "role", op: "EQUAL", value: "student" }], 2000);
  for (const u of students) {
    const uid = u.id;
    const data = u.data;
    if (data.emailPreferences?.lifecycle === false) continue;
    const sinceReg = daysSince(typeof data.createdAt === "string" ? data.createdAt : null);

    // student_book_nudge — registered 7+ days, no session booked
    if ((only.length === 0 || only.includes("student_book_nudge")) && sinceReg >= 7) {
      const sessions = await runQuery("sessions", [{ field: "studentId", op: "EQUAL", value: uid }], 1);
      if (sessions.length === 0) {
        const ok = await shouldSend(uid, "student_book_nudge", 2, 7);
        if (ok) {
          out.push(`student_book_nudge → ${data.email}`);
          if (!dryRun) await sendLifecycle({
            userId: uid, to: data.email, role: "student",
            kind: "student_book_nudge",
            subject: "Book your first session — special 50% off demo",
            headline: "Ready to Start Learning?",
            bodyHtml: `<p>Hi <strong>${data.fullName}</strong>,</p>
              <p>You're all set up — now meet a tutor! Book a demo session at <strong>50% off</strong> and see how TutorsPool fits your learning style.</p>`,
            ctaUrl: `${SITE}/find-tutors`, ctaLabel: "Browse Tutors",
          });
        }
      }
    }

    // student_quiz_pending — any quizAssignment pending > 2 days
    if (only.length === 0 || only.includes("student_quiz_pending")) {
      const pending = await runQuery("quizAssignments", [
        { field: "studentId", op: "EQUAL", value: uid },
        { field: "status", op: "EQUAL", value: "pending" },
      ], 5);
      const old = pending.filter((p) => daysSince(p.data.createdAt) >= 2);
      if (old.length > 0) {
        const ok = await shouldSend(uid, "student_quiz_pending", 2, 3);
        if (ok) {
          out.push(`student_quiz_pending → ${data.email}`);
          if (!dryRun) await sendLifecycle({
            userId: uid, to: data.email, role: "student",
            kind: "student_quiz_pending",
            subject: "Your tutor assigned you a quiz",
            headline: "You Have a Pending Quiz",
            bodyHtml: `<p>Hi <strong>${data.fullName}</strong>,</p>
              <p>Your tutor is waiting for you to complete <strong>${old.length} pending quiz${old.length > 1 ? "es" : ""}</strong>. It only takes a few minutes!</p>`,
            ctaUrl: `${SITE}/student/quizzes`, ctaLabel: "Take Quiz Now",
          });
        }
      }
    }

    // student_inactive — no lastSeenAt activity 14d
    if (only.length === 0 || only.includes("student_inactive")) {
      const lastSeen = data.lastSeenAt;
      if (lastSeen && daysSince(lastSeen) >= 14) {
        const ok = await shouldSend(uid, "student_inactive", 3, 14);
        if (ok) {
          out.push(`student_inactive → ${data.email}`);
          if (!dryRun) await sendLifecycle({
            userId: uid, to: data.email, role: "student",
            kind: "student_inactive",
            subject: "Pick up where you left off",
            headline: "Continue Your Learning Journey",
            bodyHtml: `<p>Hi <strong>${data.fullName}</strong>,</p>
              <p>Your tutor and your learning streak are waiting. Jump back in for just 10 minutes today.</p>`,
            ctaUrl: `${SITE}/student/dashboard`, ctaLabel: "Open Dashboard",
          });
        }
      }
    }
  }
  return out;
}

// ── Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let dryRun = false;
    let only: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      dryRun = !!body.dryRun;
      only = Array.isArray(body.only) ? body.only : [];
    }
    const sent: string[] = [];
    sent.push(...await evalTutorRules(dryRun, only));
    sent.push(...await evalStudentRules(dryRun, only));
    console.log(`[lifecycle-emails] dryRun=${dryRun} sent=${sent.length}`, sent);
    return new Response(JSON.stringify({ ok: true, dryRun, count: sent.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[lifecycle-emails] ERROR", err);
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
