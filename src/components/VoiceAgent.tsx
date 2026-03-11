import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function VoiceAgent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice agent connected");
    },
    onDisconnect: () => {
      console.log("Voice agent disconnected");
    },
    onError: (error) => {
      // Guard against SDK bug where error can be undefined
      if (error) {
        console.error("Voice agent error:", error);
      } else {
        console.warn("Voice agent: received undefined error event (SDK bug), ignoring");
        return;
      }
      toast({
        variant: "destructive",
        title: "Voice Agent Error",
        description: "Connection failed. Please try again.",
      });
    },
    clientTools: {
      navigateTo: async (params: { page: string }) => {
        const page = params.page.startsWith('/') ? params.page : `/${params.page}`;
        window.location.assign(window.location.origin + page);
        return `Navigating user to ${page}`;
      },
      openWhatsApp: () => {
        window.open("https://wa.me/923453284284", "_blank");
        return "Opened WhatsApp support chat";
      },
      showNotification: (params: { title: string; message: string }) => {
        toast({ title: params.title, description: params.message });
        return "Notification displayed";
      },
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error || !data?.signed_url) {
        throw new Error(error?.message || "No signed URL received");
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            prompt: {
              prompt: `You are TutorsPool AI Assistant — a friendly, knowledgeable voice agent for the TutorsPool online tutoring platform. Your job is to help users navigate the platform and answer questions about it.

ABOUT TUTORSPOOL:
- TutorsPool connects students with expert tutors for personalized learning
- Three user roles: Students, Tutors, and Admins
- Subjects offered: Math, Science, English, Programming, Languages, and more
- Sessions are conducted via Zoom video calls
- Tutors set their own hourly rates and availability

STUDENT FEATURES:
- Browse and search for tutors by subject, rating, and availability
- Book tutoring sessions with preferred tutors
- Set learning goals and track progress
- Take AI-generated quizzes (SmartGen™) assigned by tutors
- View achievements and streaks (gamification)
- Edit profile and manage sessions

TUTOR FEATURES:
- Create a professional profile with subjects and hourly rate
- Set availability slots for students to book
- Accept or manage session requests
- Create and assign SmartGen™ quizzes to students
- Track student progress and session history

GETTING STARTED:
- Sign up at the Register page, choose Student or Tutor role
- Complete your profile
- Students: browse tutors and book sessions
- Tutors: set availability and wait for bookings

SUPPORT:
- For help, contact via WhatsApp: +92 345 3284 284
- Visit the Help Center or FAQ page on the website

AVAILABLE TOOLS (use these to take actions for the user):
1. navigateTo({ page: string }) — Navigate the user to a page. Available pages:
   - /tutors (Find Tutors), /subjects (Browse Subjects), /reviews (Reviews)
   - /register (Sign Up), /login (Sign In), /forgot-password (Reset Password)
   - /about (About Us), /contact (Contact), /blog (Blog)
   - /help (Help Center), /faq (FAQ), /careers (Careers)
   - /student/dashboard, /student/tutors, /student/sessions, /student/goals, /student/quizzes, /student/achievements, /student/profile
   - /tutor/dashboard, /tutor/sessions, /tutor/availability, /tutor/profile, /tutor/quizzes, /tutor/quizzes/create
   Use this when a user says things like "take me to...", "show me...", "I want to find tutors", "I want to sign up", etc.

2. openWhatsApp() — Open WhatsApp support chat with TutorsPool team. Use when user asks for direct support or wants to chat with a human.

3. showNotification({ title: string, message: string }) — Show a toast notification on screen. Use to confirm actions or provide quick tips.

RULES:
- Only discuss TutorsPool platform topics
- Be concise, warm, and helpful
- If asked about unrelated topics, politely redirect to TutorsPool
- Guide users step-by-step when they need help with platform features
- ALWAYS use the appropriate tool when the user wants to navigate or needs support — don't just describe what to do, actually do it for them`,
            },
            firstMessage: "Hi there! I'm your TutorsPool assistant. I can help you find tutors, book sessions, understand our features, or answer any questions about the platform. What would you like to know?",
            language: "en",
          },
        },
      });
    } catch (err) {
      console.error("Failed to start voice conversation:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Required",
        description: "Please enable microphone access to use the voice agent.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)]">
      {/* Status indicator */}
      {isConnected && (
        <div className="bg-background/90 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-elevated text-xs text-center animate-fade-in">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                conversation.isSpeaking
                  ? "bg-success animate-pulse"
                  : "bg-warning"
              }`}
            />
            <span className="text-muted-foreground font-medium">
              {conversation.isSpeaking ? "Agent speaking…" : "Listening…"}
            </span>
          </div>
        </div>
      )}

      {/* Animated border pill button */}
      <div className="relative group">
        {/* Animated gradient border */}
        <div className="absolute -inset-[2px] rounded-full bg-[length:300%_300%] animate-[gradient-spin_3s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(280, 70%, 55%), hsl(var(--primary)), hsl(200, 80%, 55%), hsl(var(--primary)))",
            backgroundSize: "300% 100%",
          }}
        />
        
        {/* Inner content */}
        {isConnected ? (
          <button
            onClick={stopConversation}
            className="relative flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-secondary text-secondary-foreground font-display font-medium text-sm tracking-wide hover:bg-secondary/90 transition-colors"
            aria-label="End voice conversation"
          >
            <PhoneOff className="h-4 w-4" />
            <span>End Call</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          </button>
        ) : (
          <button
            onClick={startConversation}
            disabled={isConnecting}
            className="relative flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-secondary text-secondary-foreground font-display font-medium text-sm tracking-wide hover:bg-secondary/90 transition-colors disabled:opacity-60"
            aria-label="Start voice conversation"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Talk to Agent</span>
                <span className="text-xs opacity-60">✦</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
