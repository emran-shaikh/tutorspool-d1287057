import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      console.error("Voice agent error:", error);
      toast({
        variant: "destructive",
        title: "Voice Agent Error",
        description: "Connection failed. Please try again.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "No token received");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
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

RULES:
- Only discuss TutorsPool platform topics
- Be concise, warm, and helpful
- If asked about unrelated topics, politely redirect to TutorsPool
- Guide users step-by-step when they need help with platform features
- Suggest relevant pages or actions the user can take`,
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
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
      {/* Status indicator */}
      {isConnected && (
        <div className="bg-background/95 backdrop-blur-sm border rounded-xl px-3 py-2 shadow-lg text-xs text-center animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                conversation.isSpeaking
                  ? "bg-green-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span className="text-muted-foreground">
              {conversation.isSpeaking ? "Agent speaking…" : "Listening…"}
            </span>
          </div>
        </div>
      )}

      {/* Main button */}
      {isConnected ? (
        <Button
          onClick={stopConversation}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          aria-label="End voice conversation"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      ) : (
        <Button
          onClick={startConversation}
          disabled={isConnecting}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg gradient-primary text-primary-foreground hover:shadow-xl hover:scale-105 transition-all"
          aria-label="Start voice conversation"
        >
          {isConnecting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  );
}
