import { useEffect, useState } from "react";
import { X, Megaphone, Sparkles, ArrowRight } from "lucide-react";
import { getActiveAnnouncements, Announcement } from "@/lib/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [popupAnnouncement, setPopupAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed-announcements");
    if (stored) setDismissedIds(new Set(JSON.parse(stored)));

    getActiveAnnouncements().then((data) => {
      setAnnouncements(data);
      const storedSet = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
      const popup = data.find((a) => a.displayType === "popup" && !storedSet.has(a.id!));
      if (popup) setPopupAnnouncement(popup);
    });
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    sessionStorage.setItem("dismissed-announcements", JSON.stringify([...next]));
  };

  const banners = announcements.filter(
    (a) => a.displayType === "banner" && !dismissedIds.has(a.id!)
  );

  return (
    <>
      {banners.map((a) => (
        <div
          key={a.id}
          className="relative overflow-hidden gradient-primary"
        >
          {/* Animated background accents */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl animate-float" />
            <div className="absolute right-1/4 -bottom-2 w-32 h-32 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute right-10 top-0 w-16 h-16 rounded-full bg-white/10 blur-xl animate-float" style={{ animationDelay: "1.5s" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
              <Megaphone className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-primary-foreground shrink-0">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              <p className="text-sm font-semibold text-primary-foreground">
                {a.title}
              </p>
              <span className="hidden sm:inline text-sm text-primary-foreground/80">
                — {a.content}
              </span>
            </div>
            <button
              onClick={() => dismiss(a.id!)}
              className="shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all duration-200 text-primary-foreground"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {popupAnnouncement && (
        <Dialog
          open={!dismissedIds.has(popupAnnouncement.id!)}
          onOpenChange={(open) => {
            if (!open) dismiss(popupAnnouncement.id!);
          }}
        >
          <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-elevated rounded-2xl">
            {/* Decorative header */}
            <div className="relative gradient-primary px-6 pt-8 pb-10">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl animate-float" />
                <div className="absolute left-10 bottom-0 w-20 h-20 rounded-full bg-white/5 blur-xl" />
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
                  <Megaphone className="h-7 w-7 text-primary-foreground" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary-foreground tracking-tight">
                    {popupAnnouncement.title}
                  </DialogTitle>
                </DialogHeader>
              </div>
            </div>

            {/* Content area with overlap effect */}
            <div className="-mt-4 relative bg-card rounded-t-2xl px-6 pt-6 pb-6">
              <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
                {popupAnnouncement.content}
              </p>
              <Button
                onClick={() => dismiss(popupAnnouncement.id!)}
                className="w-full mt-5"
                variant="hero"
                size="lg"
              >
                Got it
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
