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
