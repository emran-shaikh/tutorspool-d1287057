import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadAdSense = () => {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    const s = document.createElement("script");
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8398028846106746";
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  };

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
    loadAdSense();
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
    // Disable Google Analytics & AdSense tracking
    (window as any)["ga-disable-G-EMJX84775R"] = true;
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="container max-w-4xl">
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-sm text-muted-foreground">
            <p>
              We use cookies and similar technologies to improve your experience,
              serve personalized ads via Google AdSense, and analyze traffic. By
              clicking "Accept", you consent to our use of cookies.{" "}
              <a
                href="/privacy"
                className="underline text-primary hover:text-primary/80"
              >
                Privacy Policy
              </a>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={decline}>
              Decline
            </Button>
            <Button size="sm" onClick={accept}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
