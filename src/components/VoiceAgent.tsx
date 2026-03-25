import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CREDIT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const FAST_DISCONNECT_THRESHOLD = 3000; // 3 seconds

export function VoiceAgent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCredits, setHasCredits] = useState(true);
  const connectTimeRef = useRef<number | null>(null);
  const { toast } = useToast();

  const checkCredits = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-check-credits");
      if (error || !data?.has_credits) {
        if (hasCredits) console.log("🚫 Voice agent hidden: credits exhausted");
        setHasCredits(false);
        return false;
      }
      if (!hasCredits) console.log("✅ Voice agent restored: credits available");
      setHasCredits(true);
      return true;
    } catch {
      setHasCredits(false);
      return false;
    }
  }, [hasCredits]);

  // Check credits on mount and every 5 minutes
  useEffect(() => {
    checkCredits();
    const interval = setInterval(checkCredits, CREDIT_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkCredits]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice agent connected");
      connectTimeRef.current = Date.now();
    },
    onDisconnect: () => {
      console.log("Voice agent disconnected");
      // Fast disconnect detection: if disconnected within 3s, likely no credits
      if (connectTimeRef.current && Date.now() - connectTimeRef.current < FAST_DISCONNECT_THRESHOLD) {
        console.log("🚫 Voice agent hidden: fast disconnect detected (likely no credits)");
        setHasCredits(false);
      }
      connectTimeRef.current = null;
    },
    onError: (error) => {
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

      if (error) {
        throw new Error(error?.message || "Edge function invocation failed");
      }

      if (data?.is_quota_error) {
        console.log("🚫 Voice agent hidden: credits exhausted (quota error from token request)");
        setHasCredits(false);
        toast({
          variant: "destructive",
          title: "Voice Agent Unavailable",
          description: "ElevenLabs credits may be exhausted. The agent will return when credits reset.",
        });
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.signed_url) {
        throw new Error("No signed URL received");
      }

      console.log("✅ Signed URL obtained, starting session...");

      if (conversation.status !== "disconnected") {
        await conversation.endSession();
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
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

  // Hide completely when no credits
  if (!hasCredits) return null;

  const isConnected = conversation.status === "connected";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)] sm:bottom-8 sm:right-8">
      {/* Status indicator */}
      {isConnected && (
        <div className="bg-background/90 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5 shadow-elevated text-xs animate-fade-in">
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

      {/* Button */}
      <div className="relative group">
        <div className="absolute -inset-[2px] rounded-full bg-[length:300%_300%] animate-[gradient-spin_3s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(280, 70%, 55%), hsl(var(--primary)), hsl(200, 80%, 55%), hsl(var(--primary)))",
            backgroundSize: "300% 100%",
          }}
        />
        
        {isConnected ? (
          <button
            onClick={stopConversation}
            className="relative flex items-center gap-2 px-5 py-3 rounded-full bg-secondary text-secondary-foreground font-display font-medium text-sm tracking-wide hover:bg-secondary/90 transition-colors sm:px-7 sm:py-3.5"
            aria-label="End voice conversation"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">End Call</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          </button>
        ) : (
          <button
            onClick={startConversation}
            disabled={isConnecting}
            className="relative flex items-center gap-2 px-5 py-3 rounded-full bg-secondary text-secondary-foreground font-display font-medium text-sm tracking-wide hover:bg-secondary/90 transition-colors disabled:opacity-60 sm:px-7 sm:py-3.5"
            aria-label="Start voice conversation"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                <span className="hidden sm:inline">Connecting…</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Talk to Agent</span>
                <span className="text-xs opacity-60 hidden sm:inline">✦</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
