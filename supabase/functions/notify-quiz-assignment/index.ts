import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const FROM_ADDRESS = "TutorsPool <no-reply@tutorspool.com>";

interface NotifyQuizRequest {
  studentEmail: string;
  studentName: string;
  tutorName: string;
  subject: string;
  topic: string;
  quizId: string;
}

function renderLayout(title: string, body: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,0.12);overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6,#a855f7);padding:20px 24px;color:#e5e7eb;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#f9fafb;">TutorsPool</h1>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Interactive Learning Quiz</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 20px 24px;color:#111827;">
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#111827;">${title}</h2>
              <div style="font-size:14px;line-height:1.6;color:#374151;">
                ${body}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
              <p style="margin-top:12px;">You are receiving this email because you have an account with TutorsPool.</p>
              <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} TutorsPool. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotifyQuizRequest = await req.json();

    if (!payload.studentEmail || !payload.studentName || !payload.tutorName || !payload.subject || !payload.topic) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = renderLayout(
      "New Quiz Assigned to You! 📚",
      `
      <p>Hi ${payload.studentName},</p>
      <p><strong>${payload.tutorName}</strong> has assigned you a new interactive quiz!</p>
      <div style="background:linear-gradient(135deg,#f3e8ff,#ede9fe);padding:16px;border-radius:12px;margin:16px 0;border-left:4px solid #8b5cf6;">
        <p style="margin:0;font-size:16px;font-weight:600;color:#7c3aed;">📖 ${payload.subject}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">Topic: ${payload.topic}</p>
      </div>
      <p>This quiz includes:</p>
      <ul style="padding-left:20px;color:#374151;">
        <li>📝 Visual flashcards to help you learn</li>
        <li>❓ 50 interactive questions</li>
        <li>📊 Instant results and feedback</li>
      </ul>
      <p style="margin-top:16px;">
        <a href="https://tutorspool.com/student/quizzes" style="display:inline-block;padding:12px 24px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#a855f7);color:#f9fafb;text-decoration:none;font-weight:600;font-size:14px;">Start Quiz Now</a>
      </p>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Good luck with your quiz!</p>
    `
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [payload.studentEmail],
      subject: `📚 New Quiz: ${payload.subject} - ${payload.topic}`,
      html,
    });

    console.log(`Quiz notification sent to ${payload.studentEmail}:`, result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending quiz notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
