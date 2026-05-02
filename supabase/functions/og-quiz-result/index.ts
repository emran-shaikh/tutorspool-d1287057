import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIREBASE_PROJECT_ID = "tutorspooldb";

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

    // Fetch result from Firestore REST API
    const resultFields = await getFirestoreDoc("quizResults", resultId);
    if (!resultFields) {
      return new Response(generateFallbackSVG(), {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
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

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return new Response(generateFallbackSVG(), {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
    });
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
    <linearGradient id="progressBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.05)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="100" cy="530" r="200" fill="rgba(139,92,246,0.08)"/>
  <circle cx="1100" cy="100" r="180" fill="rgba(232,121,249,0.06)"/>

  <!-- TutorsPool Logo Area -->
  <rect x="50" y="35" width="38" height="38" rx="8" fill="url(#accent)" opacity="0.9"/>
  <text x="58" y="62" font-family="Arial, sans-serif" font-size="22" fill="white">🎓</text>
  <text x="100" y="62" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">TutorsPool</text>
  <text x="262" y="62" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">SmartGen™ Quiz</text>

  <!-- Trophy Icon -->
  <circle cx="600" cy="185" r="55" fill="url(#trophy)" opacity="0.9"/>
  <text x="600" y="200" font-family="Arial, sans-serif" font-size="45" fill="white" text-anchor="middle">${data.emoji}</text>

  <!-- Score -->
  <text x="600" y="290" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="url(#accent)" text-anchor="middle">${data.accuracy}%</text>
  <text x="600" y="325" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.6)" text-anchor="middle">${data.label}</text>

  <!-- Progress bar background -->
  <rect x="370" y="350" width="460" height="12" rx="6" fill="url(#progressBg)"/>
  <!-- Progress bar fill -->
  <rect x="370" y="350" width="${progressWidth}" height="12" rx="6" fill="url(#accent)"/>

  <!-- Stats -->
  <rect x="310" y="390" width="130" height="80" rx="12" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.25)" stroke-width="1"/>
  <text x="375" y="425" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#4ade80" text-anchor="middle">${data.correctAnswers}</text>
  <text x="375" y="452" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.5)" text-anchor="middle">Correct</text>

  <rect x="460" y="390" width="130" height="80" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <text x="525" y="425" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="rgba(255,255,255,0.7)" text-anchor="middle">${data.totalQuestions}</text>
  <text x="525" y="452" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.5)" text-anchor="middle">Total</text>

  <rect x="610" y="390" width="130" height="80" rx="12" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.25)" stroke-width="1"/>
  <text x="675" y="425" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#f87171" text-anchor="middle">${data.totalQuestions - data.correctAnswers}</text>
  <text x="675" y="452" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.5)" text-anchor="middle">Wrong</text>

  <!-- Subject & Topic -->
  <text x="600" y="520" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle">${escapeXml(data.subject)} · ${escapeXml(data.topic)}</text>

  <!-- Student name -->
  <text x="600" y="550" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.4)" text-anchor="middle">Completed by ${escapeXml(data.studentName)}</text>

  <!-- Bottom CTA -->
  <rect x="460" y="575" width="280" height="36" rx="18" fill="url(#accent)" opacity="0.15"/>
  <text x="600" y="599" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="url(#accent)" text-anchor="middle">Join TutorsPool · Start Learning Free</text>
</svg>`;
}

function generateFallbackSVG(): string {
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
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">🎓 TutorsPool</text>
  <text x="600" y="340" font-family="Arial, sans-serif" font-size="28" fill="url(#accent)" text-anchor="middle">SmartGen™ Quiz Results</text>
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.5)" text-anchor="middle">Transform Your Learning Journey</text>
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
