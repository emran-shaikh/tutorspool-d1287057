import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Sparkles, X, Send } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [tracked, setTracked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trackEvent = useCallback(async (type: "view" | "cta_click" | "dismiss" | "form_submit") => {
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

    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && !tracked) {
        // Track intent only
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [tracked, trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "demoRequests"), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        timestamp: serverTimestamp(),
        status: "pending",
      });
      trackEvent("form_submit");
      setSubmitted(true);
      toast.success("Demo request submitted! We'll contact you soon.");

      // Send admin email notification
      supabase.functions.invoke("send-email", {
        body: { type: "demo_request", name: name.trim(), email: email.trim(), phone: phone.trim() },
      }).catch(err => console.error("Failed to send demo email notification", err));

      setTimeout(() => setOpen(false), 2000);
    } catch (err) {
      console.error("Failed to submit demo request", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    trackEvent("dismiss");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl shadow-2xl gap-0 [&>button.absolute]:hidden">
        <VisuallyHidden.Root asChild>
          <DialogTitle>Special Offer</DialogTitle>
        </VisuallyHidden.Root>
        <VisuallyHidden.Root asChild>
          <DialogDescription>Book a free demo and get 50% off your first session</DialogDescription>
        </VisuallyHidden.Root>
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-orange-600 p-8 text-center text-primary-foreground">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 rounded-full p-1 hover:bg-primary-foreground/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
            <Gift className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-1">Wait! Don't Go Yet 🎉</h2>
          <p className="text-primary-foreground/90 text-sm">Book a FREE demo + get 50% off your first session</p>
        </div>

        <div className="p-6 space-y-4 text-center">
          {submitted ? (
            <div className="py-6 space-y-2">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <p className="text-lg font-bold text-foreground">Thank you!</p>
              <p className="text-sm text-muted-foreground">We'll reach out to schedule your free demo.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">FREE Demo + Flat 50% OFF</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-left">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={20}
                />
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Book My Free Demo"}
                  {!submitting && <Send className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                No thanks, I'll pass
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
