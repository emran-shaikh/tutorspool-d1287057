import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { getActiveAnnouncements, Announcement } from "@/lib/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [popupAnnouncement, setPopupAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed-announcements");
    if (stored) setDismissedIds(new Set(JSON.parse(stored)));

    getActiveAnnouncements().then((data) => {
      setAnnouncements(data);
      // Show first popup-type announcement that hasn't been dismissed
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
          className="relative bg-primary text-primary-foreground"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-start gap-3">
            <Megaphone className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-sm opacity-90 whitespace-pre-line mt-1">{a.content}</p>
            </div>
            <button
              onClick={() => dismiss(a.id!)}
              className="shrink-0 p-1 rounded-md hover:bg-primary-foreground/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {popupAnnouncement.title}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
              {popupAnnouncement.content}
            </p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
