import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X, ArrowRight } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "react-router-dom";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [tracked, setTracked] = useState(false);

  const trackEvent = useCallback(async (type: "view" | "cta_click" | "dismiss") => {
    try {
      await addDoc(collection(db, "exitPopupEvents"), {
        type,
        timestamp: serverTimestamp(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      });
    } catch (e) {
      console.error("Failed to track popup event", e);
    }
  }, []);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("exit_popup_shown");
    if (alreadyShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !tracked) {
        setOpen(true);
        setTracked(true);
        sessionStorage.setItem("exit_popup_shown", "true");
        trackEvent("view");
      }
    };

    // Mobile: detect back/tab switch via visibilitychange
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && !tracked) {
        // We can't show popup when hidden, but we track intent
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [tracked, trackEvent]);

  const handleCTAClick = () => {
    trackEvent("cta_click");
    setOpen(false);
  };

  const handleDismiss = () => {
    trackEvent("dismiss");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl shadow-2xl gap-0">
        {/* Top gradient banner */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-orange-600 p-8 text-center text-primary-foreground">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 rounded-full p-1 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Gift className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-1">Wait! Don't Go Yet 🎉</h2>
          <p className="text-primary-foreground/90 text-sm">We have a special offer just for you</p>
        </div>

        {/* Offer body */}
        <div className="p-6 space-y-5 text-center">
          {/* Free demo */}
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg text-foreground">FREE Demo Class</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Try a session with any tutor — completely free, no commitment.
            </p>
          </div>

          {/* 50% off */}
          <div className="rounded-xl bg-secondary text-secondary-foreground p-4">
            <p className="text-3xl font-extrabold font-display">50% OFF</p>
            <p className="text-sm opacity-90">on your first tutoring session</p>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            asChild
            onClick={handleCTAClick}
          >
            <Link to="/register">
              Claim Your Free Demo <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <button
            onClick={handleDismiss}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            No thanks, I'll pass
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
