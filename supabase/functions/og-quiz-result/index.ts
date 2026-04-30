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

async function getFirestoreDoc(collection: string, docId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.fields;
}

function getVal(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  return null;
}

function getPerformanceEmoji(accuracy: number) {
  if (accuracy >= 90) return "🏆";
  if (accuracy >= 75) return "🌟";
  if (accuracy >= 60) return "💪";
  if (accuracy >= 40) return "📚";
  return "📖";
}

function getPerformanceLabel(accuracy: number) {
  if (accuracy >= 90) return "Outstanding!";
  if (accuracy >= 75) return "Great Job!";
  if (accuracy >= 60) return "Solid Work!";
  if (accuracy >= 40) return "Making Progress!";
  return "Keep Learning!";
}

async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const resultId = url.searchParams.get("resultId");

    if (!resultId) {
      return new Response("Missing resultId", { status: 400, headers: corsHeaders });
    }

    const resultFields = await getFirestoreDoc("quizResults", resultId);
    if (!resultFields) {
      const png = await svgToPng(generateFallbackSVG());
      return new Response(png, {
        headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
      });
    }

    const accuracy = getVal(resultFields.accuracy) || 0;
    const correctAnswers = getVal(resultFields.correctAnswers) || 0;
    const totalQuestions = getVal(resultFields.totalQuestions) || 0;
    const studentName = getVal(resultFields.studentName) || "Student";
    const quizId = getVal(resultFields.quizId);

    let subject = "Quiz";
    let topic = "Results";
    if (quizId) {
      const quizFields = await getFirestoreDoc("quizzes", quizId);
      if (quizFields) {
        subject = getVal(quizFields.subject) || "Quiz";
        topic = getVal(quizFields.topic) || "Results";
      }
    }

    const emoji = getPerformanceEmoji(accuracy);
    const label = getPerformanceLabel(accuracy);

    const svg = generateOGImage({ accuracy, correctAnswers, totalQuestions, studentName, subject, topic, emoji, label });
    const png = await svgToPng(svg);

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    try {
      const png = await svgToPng(generateFallbackSVG());
      return new Response(png, {
        headers: { ...corsHeaders, "Content-Type": "image/png" },
      });
    } catch {
      return new Response(generateFallbackSVG(), {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
      });
    }
  }
});

interface OGData {
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  studentName: string;
  subject: string;
  topic: string;
  emoji: string;
  label: string;
}

function generateOGImage(data: OGData): string {
  const progressWidth = (data.accuracy / 100) * 460;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1145"/>
      <stop offset="50%" style="stop-color:#2d1b69"/>
      <stop offset="100%" style="stop-color:#4a1942"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa"/>
      <stop offset="100%" style="stop-color:#e879f9"/>
    </linearGradient>
    <linearGradient id="trophy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="100" cy="530" r="200" fill="rgba(139,92,246,0.08)"/>
  <circle cx="1100" cy="100" r="180" fill="rgba(232,121,249,0.06)"/>

  <rect x="50" y="35" width="38" height="38" rx="8" fill="url(#accent)" opacity="0.9"/>
  <text x="100" y="62" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">TutorsPool</text>
  <text x="262" y="62" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">SmartGen Quiz</text>

  <circle cx="600" cy="185" r="55" fill="url(#trophy)" opacity="0.9"/>
  <text x="600" y="205" font-family="Arial, sans-serif" font-size="50" fill="white" text-anchor="middle">${data.emoji}</text>

  <text x="600" y="305" font-family="Arial, sans-serif" font-size="90" font-weight="bold" fill="#e879f9" text-anchor="middle">${data.accuracy}%</text>
  <text x="600" y="340" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle">${data.label}</text>

  <rect x="370" y="365" width="460" height="14" rx="7" fill="rgba(255,255,255,0.1)"/>
  <rect x="370" y="365" width="${progressWidth}" height="14" rx="7" fill="url(#accent)"/>

  <rect x="310" y="410" width="130" height="80" rx="12" fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.4)" stroke-width="1.5"/>
  <text x="375" y="445" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#4ade80" text-anchor="middle">${data.correctAnswers}</text>
  <text x="375" y="472" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">Correct</text>

  <rect x="460" y="410" width="130" height="80" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <text x="525" y="445" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">${data.totalQuestions}</text>
  <text x="525" y="472" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">Total</text>

  <rect x="610" y="410" width="130" height="80" rx="12" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.4)" stroke-width="1.5"/>
  <text x="675" y="445" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#f87171" text-anchor="middle">${data.totalQuestions - data.correctAnswers}</text>
  <text x="675" y="472" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">Wrong</text>

  <text x="600" y="535" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.85)" text-anchor="middle">${escapeXml(data.subject)} - ${escapeXml(data.topic)}</text>
  <text x="600" y="565" font-family="Arial, sans-serif" font-size="15" fill="rgba(255,255,255,0.5)" text-anchor="middle">Completed by ${escapeXml(data.studentName)}</text>

  <rect x="430" y="585" width="340" height="38" rx="19" fill="rgba(232,121,249,0.2)"/>
  <text x="600" y="610" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#e879f9" text-anchor="middle">Join TutorsPool - Start Learning Free</text>
</svg>`;
}

function generateFallbackSVG(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1145"/>
      <stop offset="100%" style="stop-color:#4a1942"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">TutorsPool</text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="30" fill="#e879f9" text-anchor="middle">SmartGen Quiz Results</text>
  <text x="600" y="410" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.6)" text-anchor="middle">Transform Your Learning Journey</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
