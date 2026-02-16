import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const FROM_ADDRESS = "TutorsPool <no-reply@tutorspool.com>";
const ADMIN_EMAILS = ["info@tutorspool.com", "itsartificialimran@gmail.com"];
const SITE = "https://tutorspool.com";

/* ─── Role Themes ─── */
type Role = "student" | "tutor" | "admin";

const THEMES: Record<Role, { gradient: string; accent: string; accentFg: string; badge: string; icon: string }> = {
  student: {
    gradient: "linear-gradient(135deg, #2563eb, #06b6d4)",
    accent: "#2563eb",
    accentFg: "#ffffff",
    badge: "#dbeafe",
    icon: "📘",
  },
  tutor: {
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    accent: "#059669",
    accentFg: "#ffffff",
    badge: "#d1fae5",
    icon: "🎓",
  },
  admin: {
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
    accent: "#7c3aed",
    accentFg: "#ffffff",
    badge: "#ede9fe",
    icon: "🛡️",
  },
};

/* ─── Premium Layout ─── */
function renderLayout(role: Role, title: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  const t = THEMES[role];
  const year = new Date().getFullYear();

  const ctaBlock = ctaUrl && ctaLabel
    ? `<tr><td style="padding:0 40px 28px;">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;border-radius:10px;background:${t.gradient};color:${t.accentFg};text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(0,0,0,0.15);">${ctaLabel}</a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.08),0 1px 3px rgba(15,23,42,0.06);">

  <!-- Header -->
  <tr>
    <td style="background:${t.gradient};padding:28px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">TutorsPool</span>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:0.5px;text-transform:uppercase;">Personalized Tutoring, Made Simple</p>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="font-size:28px;">${t.icon}</span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Accent bar -->
  <tr><td style="height:4px;background:${t.gradient};opacity:0.3;"></td></tr>

  <!-- Title -->
  <tr>
    <td style="padding:32px 40px 8px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:8px 40px 28px;font-size:15px;line-height:1.7;color:#334155;">
      ${body}
    </td>
  </tr>

  <!-- CTA -->
  ${ctaBlock}

  <!-- Divider -->
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px 24px;font-size:11px;color:#94a3b8;line-height:1.6;">
      <p style="margin:0;">You're receiving this because you have an account on <a href="${SITE}" style="color:${t.accent};text-decoration:none;">TutorsPool</a>.</p>
      <p style="margin:6px 0 0;">&copy; ${year} TutorsPool. All rights reserved.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─── Info box helper ─── */
function infoBox(items: Record<string, string>, bgColor = "#f8fafc", borderColor = "#e2e8f0"): string {
  const rows = Object.entries(items)
    .map(([k, v]) => `<p style="margin:0 0 6px;"><span style="color:#64748b;font-size:13px;">${k}</span><br><strong style="color:#0f172a;font-size:14px;">${v}</strong></p>`)
    .join("");
  return `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;padding:16px 20px;margin:16px 0;">${rows}</div>`;
}

/* ─── Types ─── */
type EmailType =
  | "welcome" | "session_booking" | "session_update" | "session_cancel"
  | "session_reminder" | "session_completed" | "review_thankyou"
  | "tutor_session_booking" | "tutor_session_cancel" | "tutor_review_received"
  | "admin_new_student" | "admin_new_tutor" | "tutor_approved"
  | "contact_form" | "demo_request";

interface BaseEmailRequest { type: EmailType; }
interface WelcomeEmailRequest extends BaseEmailRequest { type: "welcome"; to: string; name: string; role?: string; }
interface SessionBookingEmailRequest extends BaseEmailRequest { type: "session_booking"; to: string; studentName: string; tutorName: string; date: string; time: string; }
interface SessionUpdateEmailRequest extends BaseEmailRequest { type: "session_update" | "session_cancel"; to: string; studentName: string; tutorName: string; date: string; time: string; status: string; }
interface SessionReminderEmailRequest extends BaseEmailRequest { type: "session_reminder"; to: string; studentName: string; tutorName: string; date: string; time: string; sessionStartIso: string; }
interface SessionCompletedEmailRequest extends BaseEmailRequest { type: "session_completed"; to: string; studentName: string; tutorName: string; date: string; time: string; }
interface ReviewThankYouEmailRequest extends BaseEmailRequest { type: "review_thankyou"; to: string; studentName: string; tutorName: string; }
interface TutorSessionBookingEmailRequest extends BaseEmailRequest { type: "tutor_session_booking"; to: string; studentName: string; tutorName: string; date: string; time: string; }
interface TutorSessionCancelEmailRequest extends BaseEmailRequest { type: "tutor_session_cancel"; to: string; studentName: string; tutorName: string; date: string; time: string; cancelledBy: "student" | "tutor"; }
interface TutorReviewReceivedEmailRequest extends BaseEmailRequest { type: "tutor_review_received"; to: string; studentName: string; tutorName: string; subject: string; }
interface AdminNewStudentEmailRequest extends BaseEmailRequest { type: "admin_new_student"; studentName: string; studentEmail: string; }
interface AdminNewTutorEmailRequest extends BaseEmailRequest { type: "admin_new_tutor"; tutorName: string; tutorEmail: string; }
interface TutorApprovedEmailRequest extends BaseEmailRequest { type: "tutor_approved"; to: string; tutorName: string; }
interface ContactFormEmailRequest extends BaseEmailRequest { type: "contact_form"; name: string; email: string; subject: string; message: string; }
interface DemoRequestEmailRequest extends BaseEmailRequest { type: "demo_request"; name: string; email: string; phone: string; }

type EmailRequest =
  | WelcomeEmailRequest | SessionBookingEmailRequest | SessionUpdateEmailRequest
  | SessionReminderEmailRequest | SessionCompletedEmailRequest | ReviewThankYouEmailRequest
  | TutorSessionBookingEmailRequest | TutorSessionCancelEmailRequest | TutorReviewReceivedEmailRequest
  | AdminNewStudentEmailRequest | AdminNewTutorEmailRequest | TutorApprovedEmailRequest
  | ContactFormEmailRequest | DemoRequestEmailRequest;

/* ─── Student Emails ─── */

// CRITERIA: Sent when a student registers on the platform
async function sendWelcomeEmail(payload: WelcomeEmailRequest) {
  const role: Role = (payload.role === "tutor") ? "tutor" : "student";
  const dashboardPath = role === "tutor" ? "/tutor/dashboard" : "/student/dashboard";

  const body = `
    <p>Hi <strong>${payload.name}</strong>,</p>
    <p>Welcome aboard! Your ${role} account is ready. ${
      role === "student"
        ? "Start exploring top tutors, book sessions, and track your learning journey."
        : "Complete your profile, set your availability, and start receiving session requests."
    }</p>
    <p style="margin-top:4px;font-size:13px;color:#64748b;">Need help? Reply to this email anytime.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: `Welcome to TutorsPool, ${payload.name}! ${THEMES[role].icon}`,
    html: renderLayout(role, `Welcome to TutorsPool!`, body, `${SITE}${dashboardPath}`, "Go to Your Dashboard"),
  });
}

// CRITERIA: Sent to student when they request a session booking
async function sendBookingEmail(payload: SessionBookingEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.studentName}</strong>,</p>
    <p>Your session request has been submitted successfully.</p>
    ${infoBox({ "Tutor": payload.tutorName, "Date": payload.date, "Time": payload.time })}
    <p>Your tutor will review the request and you'll be notified once it's confirmed.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: `Session request sent to ${payload.tutorName}`,
    html: renderLayout("student", "Session Request Received", body, `${SITE}/student/sessions`, "View My Sessions"),
  });
}

// CRITERIA: Sent to student when session status changes (accepted/declined) or cancelled
async function sendUpdateEmail(payload: SessionUpdateEmailRequest) {
  const pretty = payload.status.charAt(0).toUpperCase() + payload.status.slice(1);
  const isCancelled = payload.type === "session_cancel";

  const body = `
    <p>Hi <strong>${payload.studentName}</strong>,</p>
    <p>Your session with <strong>${payload.tutorName}</strong> has been <strong>${pretty.toLowerCase()}</strong>.</p>
    ${infoBox({ "Date": payload.date, "Time": payload.time, "Status": pretty }, isCancelled ? "#fef2f2" : "#f0fdf4", isCancelled ? "#fecaca" : "#bbf7d0")}
    ${isCancelled ? "<p>You can book a new session anytime from your dashboard.</p>" : "<p>Get ready for your upcoming session!</p>"}
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: isCancelled ? "Session cancelled" : `Session ${pretty.toLowerCase()} — ${payload.tutorName}`,
    html: renderLayout("student", isCancelled ? "Session Cancelled" : `Session ${pretty}`, body, `${SITE}/student/sessions`, "View My Sessions"),
  });
}

// CRITERIA: Scheduled 24h and 1h before session start time
async function scheduleReminderEmails(payload: SessionReminderEmailRequest) {
  const sessionStart = new Date(payload.sessionStartIso);
  if (isNaN(sessionStart.getTime())) throw new Error("Invalid sessionStartIso date");

  const makeHtml = (when: string) => {
    const body = `
      <p>Hi <strong>${payload.studentName}</strong>,</p>
      <p>Your session with <strong>${payload.tutorName}</strong> starts in <strong>${when}</strong>.</p>
      ${infoBox({ "Date": payload.date, "Time": payload.time })}
      <p>Make sure your internet connection and Zoom are ready before the session begins.</p>
    `;
    return renderLayout("student", `Session starting in ${when}`, body, `${SITE}/student/sessions`, "Open Dashboard");
  };

  const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  const twentyFourBefore = new Date(sessionStart.getTime() - 24 * 60 * 60 * 1000);

  const [reminder24h, reminder1h] = await Promise.all([
    resend.emails.send({
      from: FROM_ADDRESS, to: [payload.to],
      subject: `⏰ Session in 24 hours with ${payload.tutorName}`,
      html: makeHtml("24 hours"),
      scheduledAt: twentyFourBefore.toISOString(),
    }),
    resend.emails.send({
      from: FROM_ADDRESS, to: [payload.to],
      subject: `⏰ Session in 1 hour with ${payload.tutorName}`,
      html: makeHtml("1 hour"),
      scheduledAt: oneHourBefore.toISOString(),
    }),
  ]);

  return { reminder24h, reminder1h };
}

// CRITERIA: Sent to student after a session is marked completed
async function sendSessionCompletedEmail(payload: SessionCompletedEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.studentName}</strong>,</p>
    <p>Great job completing your session with <strong>${payload.tutorName}</strong>! 🎉</p>
    ${infoBox({ "Date": payload.date, "Time": payload.time })}
    <p>Keep the momentum going — book your next session and continue your learning journey.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: `Session completed with ${payload.tutorName} 🎉`,
    html: renderLayout("student", "Session Completed!", body, `${SITE}/student/sessions`, "Book Another Session"),
  });
}

// CRITERIA: Sent to student after they submit a review for a tutor
async function sendReviewThankYouEmail(payload: ReviewThankYouEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.studentName}</strong>,</p>
    <p>Thanks for reviewing your session with <strong>${payload.tutorName}</strong>! Your feedback helps the community find great tutors.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: "Thanks for your review! ⭐",
    html: renderLayout("student", "Thank You for Your Review!", body, `${SITE}/student/dashboard`, "Back to Dashboard"),
  });
}

/* ─── Tutor Emails ─── */

// CRITERIA: Sent to tutor when a student books a session with them
async function sendTutorSessionBookingEmail(payload: TutorSessionBookingEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.tutorName}</strong>,</p>
    <p>You have a new session request from <strong>${payload.studentName}</strong>.</p>
    ${infoBox({ "Student": payload.studentName, "Date": payload.date, "Time": payload.time }, "#f0fdf4", "#bbf7d0")}
    <p>Please accept or decline this request from your dashboard.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: `New session request from ${payload.studentName}`,
    html: renderLayout("tutor", "New Session Request", body, `${SITE}/tutor/sessions`, "View Requests"),
  });
}

// CRITERIA: Sent to tutor when a session is cancelled (by student or tutor)
async function sendTutorSessionCancelEmail(payload: TutorSessionCancelEmailRequest) {
  const by = payload.cancelledBy === "student" ? "the student" : "you";
  const body = `
    <p>Hi <strong>${payload.tutorName}</strong>,</p>
    <p>The session with <strong>${payload.studentName}</strong> has been cancelled by ${by}.</p>
    ${infoBox({ "Date": payload.date, "Time": payload.time, "Cancelled by": by === "you" ? "You" : "Student" }, "#fef2f2", "#fecaca")}
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: `Session cancelled — ${payload.studentName}`,
    html: renderLayout("tutor", "Session Cancelled", body, `${SITE}/tutor/sessions`, "View Schedule"),
  });
}

// CRITERIA: Sent to tutor when a student leaves a review for them
async function sendTutorReviewReceivedEmail(payload: TutorReviewReceivedEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.tutorName}</strong>,</p>
    <p><strong>${payload.studentName}</strong> left a review for your <strong>${payload.subject}</strong> session. Check it out on your dashboard!</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: `New review from ${payload.studentName} ⭐`,
    html: renderLayout("tutor", "New Review Received!", body, `${SITE}/tutor/dashboard`, "View Review"),
  });
}

// CRITERIA: Sent to tutor when admin approves their application
async function sendTutorApprovedEmail(payload: TutorApprovedEmailRequest) {
  const body = `
    <p>Hi <strong>${payload.tutorName}</strong>,</p>
    <p>Congratulations! Your tutor application has been <strong>approved</strong> by our team. 🎉</p>
    <p>You can now:</p>
    <ul style="padding-left:20px;color:#334155;">
      <li>Set up your availability schedule</li>
      <li>Receive session bookings from students</li>
      <li>Start conducting tutoring sessions</li>
    </ul>
    <p>Welcome to the TutorsPool community!</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: [payload.to],
    subject: "🎉 You're approved as a TutorsPool Tutor!",
    html: renderLayout("tutor", "You're Approved!", body, `${SITE}/tutor/dashboard`, "Set Up Your Profile"),
  });
}

/* ─── Admin Emails ─── */

// CRITERIA: Sent to admin emails when a new student registers
async function sendAdminNewStudentEmail(payload: AdminNewStudentEmailRequest) {
  const body = `
    <p>A new <strong>student</strong> has registered on TutorsPool.</p>
    ${infoBox({ "Name": payload.studentName, "Email": payload.studentEmail }, "#dbeafe", "#93c5fd")}
    <p>The student can now browse tutors and book sessions.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: ADMIN_EMAILS,
    subject: `New Student: ${payload.studentName}`,
    html: renderLayout("admin", "New Student Registration", body, `${SITE}/admin/users`, "View All Users"),
  });
}

// CRITERIA: Sent to admin emails when a new tutor registers (needs approval)
async function sendAdminNewTutorEmail(payload: AdminNewTutorEmailRequest) {
  const body = `
    <p>A new <strong>tutor</strong> has registered and is <strong>awaiting approval</strong>.</p>
    ${infoBox({ "Name": payload.tutorName, "Email": payload.tutorEmail }, "#fef3c7", "#fcd34d")}
    <p>Please review their profile and approve or reject the application.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS, to: ADMIN_EMAILS,
    subject: `⚠️ Tutor Pending Approval: ${payload.tutorName}`,
    html: renderLayout("admin", "Tutor Approval Required", body, `${SITE}/admin/users`, "Review Pending Tutors"),
  });
}

// CRITERIA: Sent to admin emails when someone submits the contact form
async function sendContactFormEmail(payload: ContactFormEmailRequest) {
  const body = `
    <p>New message from the <strong>Contact Us</strong> form on TutorsPool.</p>
    ${infoBox({ "Name": payload.name, "Email": payload.email, "Subject": payload.subject })}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 6px;"><span style="color:#64748b;font-size:13px;">Message</span></p>
      <p style="margin:0;color:#0f172a;font-size:14px;white-space:pre-wrap;">${payload.message}</p>
    </div>
    <p>Reply directly to <a href="mailto:${payload.email}" style="color:#7c3aed;text-decoration:none;">${payload.email}</a> to respond.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAILS,
    replyTo: payload.email,
    subject: `📩 Contact Form: ${payload.subject}`,
    html: renderLayout("admin", "New Contact Form Message", body),
  });
}

// CRITERIA: Sent to admin emails when someone submits a demo request via exit popup
async function sendDemoRequestEmail(payload: DemoRequestEmailRequest) {
  const body = `
    <p>A new <strong>demo session request</strong> has been submitted via the website.</p>
    ${infoBox({ "Name": payload.name, "Email": payload.email, "Phone": payload.phone }, "#fef3c7", "#fcd34d")}
    <p>Please contact this lead to schedule their free demo session.</p>
  `;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAILS,
    replyTo: payload.email,
    subject: `🎯 New Demo Request: ${payload.name}`,
    html: renderLayout("admin", "New Demo Request", body, `${SITE}/admin/dashboard`, "View All Requests"),
  });
}

/* ─── Handler ─── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EmailRequest;

    if (!payload?.type) {
      return new Response(JSON.stringify({ error: "Missing email type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (payload.type) {
      case "welcome":            result = await sendWelcomeEmail(payload); break;
      case "session_booking":    result = await sendBookingEmail(payload); break;
      case "session_update":
      case "session_cancel":     result = await sendUpdateEmail(payload); break;
      case "session_reminder":   result = await scheduleReminderEmails(payload); break;
      case "session_completed":  result = await sendSessionCompletedEmail(payload); break;
      case "review_thankyou":    result = await sendReviewThankYouEmail(payload); break;
      case "tutor_session_booking": result = await sendTutorSessionBookingEmail(payload); break;
      case "tutor_session_cancel":  result = await sendTutorSessionCancelEmail(payload); break;
      case "tutor_review_received": result = await sendTutorReviewReceivedEmail(payload); break;
      case "admin_new_student":  result = await sendAdminNewStudentEmail(payload); break;
      case "admin_new_tutor":    result = await sendAdminNewTutorEmail(payload); break;
      case "tutor_approved":     result = await sendTutorApprovedEmail(payload); break;
      case "contact_form":       result = await sendContactFormEmail(payload); break;
      case "demo_request":       result = await sendDemoRequestEmail(payload); break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported email type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email function error", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
