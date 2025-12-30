import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const FROM_ADDRESS = "TutorsPool <no-reply@tutorspool.com>";

type EmailType =
  | "welcome"
  | "session_booking"
  | "session_update"
  | "session_cancel"
  | "session_reminder"
  | "session_completed"
  | "review_thankyou"
  | "tutor_session_booking"
  | "tutor_session_cancel"
  | "tutor_review_received";

interface BaseEmailRequest {
  type: EmailType;
}

interface WelcomeEmailRequest extends BaseEmailRequest {
  type: "welcome";
  to: string;
  name: string;
}

interface SessionBookingEmailRequest extends BaseEmailRequest {
  type: "session_booking";
  to: string; // student email
  studentName: string;
  tutorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

interface SessionUpdateEmailRequest extends BaseEmailRequest {
  type: "session_update" | "session_cancel";
  to: string; // student email
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  status: string;
}

interface SessionReminderEmailRequest extends BaseEmailRequest {
  type: "session_reminder";
  to: string;
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  sessionStartIso: string; // ISO string for session start
}

interface SessionCompletedEmailRequest extends BaseEmailRequest {
  type: "session_completed";
  to: string;
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
}

interface ReviewThankYouEmailRequest extends BaseEmailRequest {
  type: "review_thankyou";
  to: string;
  studentName: string;
  tutorName: string;
}

interface TutorSessionBookingEmailRequest extends BaseEmailRequest {
  type: "tutor_session_booking";
  to: string; // tutor email
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
}

interface TutorSessionCancelEmailRequest extends BaseEmailRequest {
  type: "tutor_session_cancel";
  to: string; // tutor email
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  cancelledBy: "student" | "tutor";
}

interface TutorReviewReceivedEmailRequest extends BaseEmailRequest {
  type: "tutor_review_received";
  to: string; // tutor email
  studentName: string;
  tutorName: string;
  subject: string;
}

type EmailRequest =
  | WelcomeEmailRequest
  | SessionBookingEmailRequest
  | SessionUpdateEmailRequest
  | SessionReminderEmailRequest
  | SessionCompletedEmailRequest
  | ReviewThankYouEmailRequest
  | TutorSessionBookingEmailRequest
  | TutorSessionCancelEmailRequest
  | TutorReviewReceivedEmailRequest;

function renderLayout(title: string, body: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,0.12);overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:20px 24px;color:#e5e7eb;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#f9fafb;">TutorsPool</h1>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Personalized tutoring, made simple.</p>
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

async function sendWelcomeEmail(payload: WelcomeEmailRequest) {
  const html = renderLayout(
    "Welcome to TutorsPool!",
    `
    <p>Hi ${payload.name},</p>
    <p>Welcome to <strong>TutorsPool</strong>! Your account has been created successfully.</p>
    <p>You can now browse tutors, book sessions, and track your learning progress.</p>
    <p style="margin-top:16px;">
      <a href="https://tutorspool.com" style="display:inline-block;padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#f9fafb;text-decoration:none;font-weight:600;font-size:13px;">Go to your dashboard</a>
    </p>
  `
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "Welcome to TutorsPool",
    html,
  });
}

async function sendBookingEmail(payload: SessionBookingEmailRequest) {
  const html = renderLayout(
    "Your tutoring session request is received",
    `
    <p>Hi ${payload.studentName},</p>
    <p>Your request to book a session with <strong>${payload.tutorName}</strong> has been received.</p>
    <p><strong>Requested time:</strong> ${payload.date} at ${payload.time}</p>
    <p>The tutor will review your request and you will receive an update once it is accepted or declined.</p>
  `
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "TutorsPool session request received",
    html,
  });
}

async function sendUpdateEmail(payload: SessionUpdateEmailRequest) {
  const prettyStatus = payload.status.charAt(0).toUpperCase() +
    payload.status.slice(1);

  const html = renderLayout(
    `Session ${prettyStatus.toLowerCase()} - ${payload.tutorName}`,
    `
    <p>Hi ${payload.studentName},</p>
    <p>Your session with <strong>${payload.tutorName}</strong> has been <strong>${prettyStatus.toLowerCase()}</strong>.</p>
    <p><strong>Time:</strong> ${payload.date} at ${payload.time}</p>
  `
  );

  const subject =
    payload.type === "session_cancel"
      ? "Your TutorsPool session was cancelled"
      : `Your TutorsPool session was ${prettyStatus.toLowerCase()}`;

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject,
    html,
  });
}

async function scheduleReminderEmails(payload: SessionReminderEmailRequest) {
  const sessionStart = new Date(payload.sessionStartIso);
  if (isNaN(sessionStart.getTime())) {
    throw new Error("Invalid sessionStartIso date");
  }

  const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  const twentyFourHoursBefore = new Date(
    sessionStart.getTime() - 24 * 60 * 60 * 1000,
  );

  const baseHtml = (when: string) =>
    renderLayout(
      `Upcoming session in ${when}`,
      `
      <p>Hi ${payload.studentName},</p>
      <p>This is a reminder for your upcoming tutoring session with <strong>${payload.tutorName}</strong>.</p>
      <p><strong>Scheduled time:</strong> ${payload.date} at ${payload.time}</p>
      <p>Please make sure your internet connection and Zoom are ready before the session starts.</p>
    `,
    );

  const [reminder24h, reminder1h] = await Promise.all([
    resend.emails.send({
      from: FROM_ADDRESS,
      to: [payload.to],
      subject: "Reminder: TutorsPool session in 24 hours",
      html: baseHtml("24 hours"),
      scheduledAt: twentyFourHoursBefore.toISOString(),
    }),
    resend.emails.send({
      from: FROM_ADDRESS,
      to: [payload.to],
      subject: "Reminder: TutorsPool session in 1 hour",
      html: baseHtml("1 hour"),
      scheduledAt: oneHourBefore.toISOString(),
    }),
  ]);

  return { reminder24h, reminder1h };
}

async function sendSessionCompletedEmail(payload: SessionCompletedEmailRequest) {
  const html = renderLayout(
    "Nice work on completing your session!",
    `
    <p>Hi ${payload.studentName},</p>
    <p>Great job completing your tutoring session with <strong>${payload.tutorName}</strong>.</p>
    <p><strong>Session time:</strong> ${payload.date} at ${payload.time}</p>
    <p style="margin-top:12px;">Keep your momentum going by booking your next session and continuing your learning journey.</p>
  `,
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "You completed a TutorsPool session 🎉",
    html,
  });
}

async function sendReviewThankYouEmail(payload: ReviewThankYouEmailRequest) {
  const html = renderLayout(
    "Thank you for your review!",
    `
    <p>Hi ${payload.studentName},</p>
    <p>Thank you for taking the time to review your session with <strong>${payload.tutorName}</strong>.</p>
    <p>Your feedback helps other students find the right tutor and helps tutors improve their sessions.</p>
    <p style="margin-top:12px;">When you're ready, you can book another session to keep learning.</p>
  `,
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "Thanks for reviewing your TutorsPool session",
    html,
  });
}

async function sendTutorSessionBookingEmail(payload: TutorSessionBookingEmailRequest) {
  const html = renderLayout(
    "New session request received",
    `
    <p>Hi ${payload.tutorName},</p>
    <p>You have a new session request from <strong>${payload.studentName}</strong>.</p>
    <p><strong>Requested time:</strong> ${payload.date} at ${payload.time}</p>
    <p>Please log in to your TutorsPool dashboard to accept or decline this request.</p>
  `,
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "New TutorsPool session request",
    html,
  });
}

async function sendTutorSessionCancelEmail(payload: TutorSessionCancelEmailRequest) {
  const by = payload.cancelledBy === "student" ? "the student" : "you";

  const html = renderLayout(
    "Session cancelled",
    `
    <p>Hi ${payload.tutorName},</p>
    <p>Your session with <strong>${payload.studentName}</strong> scheduled for ${payload.date} at ${payload.time} has been cancelled by ${by}.</p>
  `,
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "TutorsPool session cancelled",
    html,
  });
}

async function sendTutorReviewReceivedEmail(payload: TutorReviewReceivedEmailRequest) {
  const html = renderLayout(
    "You received a new review",
    `
    <p>Hi ${payload.tutorName},</p>
    <p>${payload.studentName} just left a review for your <strong>${payload.subject}</strong> session.</p>
    <p>Log in to your TutorsPool dashboard to read the full review.</p>
  `,
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [payload.to],
    subject: "New TutorsPool review received",
    html,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EmailRequest;

    if (!payload?.type) {
      return new Response(
        JSON.stringify({ error: "Missing email type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let result: unknown;

    switch (payload.type) {
      case "welcome":
        result = await sendWelcomeEmail(payload);
        break;
      case "session_booking":
        result = await sendBookingEmail(payload);
        break;
      case "session_update":
      case "session_cancel":
        result = await sendUpdateEmail(payload);
        break;
      case "session_reminder":
        result = await scheduleReminderEmails(payload);
        break;
      case "session_completed":
        result = await sendSessionCompletedEmail(payload);
        break;
      case "review_thankyou":
        result = await sendReviewThankYouEmail(payload);
        break;
      case "tutor_session_booking":
        result = await sendTutorSessionBookingEmail(payload);
        break;
      case "tutor_session_cancel":
        result = await sendTutorSessionCancelEmail(payload);
        break;
      case "tutor_review_received":
        result = await sendTutorReviewReceivedEmail(payload);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unsupported email type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("send-email function error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error while sending email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
