import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, attachUnloadHandler } from "@/lib/visitorAnalytics";

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    attachUnloadHandler();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
