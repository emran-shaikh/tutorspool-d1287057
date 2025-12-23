import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_CONTEXT = `You are TutorsPool Assistant, a helpful AI chatbot for TutorsPool - an online tutoring platform that connects students with qualified tutors.

About TutorsPool:
- TutorsPool is an online platform that helps students find and book sessions with qualified tutors
- Students can browse tutors by subject, view tutor profiles, read reviews, and book sessions
- Tutors can create profiles, set their availability, manage sessions, and track their earnings
- The platform supports various subjects including Mathematics, Science, English, Programming, Languages, and more

Key Features:
- Find Tutors: Browse and search for tutors by subject, rating, and availability
- Book Sessions: Schedule one-on-one tutoring sessions with your chosen tutor
- Learning Goals: Students can set and track their learning goals
- Reviews: Read and write reviews for tutors
- Dashboard: Both students and tutors have personalized dashboards to manage their activities

For Students:
- Create an account and complete your profile
- Browse tutors or search by subject
- View tutor profiles, qualifications, and reviews
- Book sessions at convenient times
- Track your learning progress and goals
- Leave reviews after sessions

For Tutors:
- Register as a tutor and create your profile
- Add your subjects and qualifications
- Set your availability and hourly rates
- Manage session requests and bookings
- Track your earnings and student feedback

Pricing:
- Tutors set their own hourly rates
- Session prices vary based on the tutor and subject
- Some tutors offer trial sessions

Getting Started:
- Click "Sign Up" to create an account
- Choose whether you're a student or tutor
- Complete your profile
- Start browsing tutors or accepting students!

Always be helpful, friendly, and encourage users to explore the platform. If asked about specific features not mentioned, suggest they explore the site or contact support for more details.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SITE_CONTEXT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
