import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Eye, MousePointerClick, XCircle, TrendingUp } from "lucide-react";

interface PopupStats {
  views: number;
  ctaClicks: number;
  dismissals: number;
  conversionRate: number;
  recentEvents: { type: string; timestamp: string; page: string }[];
}

export function PopupAnalytics() {
  const [stats, setStats] = useState<PopupStats>({
    views: 0,
    ctaClicks: 0,
    dismissals: 0,
    conversionRate: 0,
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "exitPopupEvents"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            type: data.type as string,
            timestamp: data.timestamp?.toDate?.()?.toLocaleString?.() || "N/A",
            page: data.page || "/",
          };
        });

        const views = events.filter((e) => e.type === "view").length;
        const ctaClicks = events.filter((e) => e.type === "cta_click").length;
        const dismissals = events.filter((e) => e.type === "dismiss").length;
        const conversionRate = views > 0 ? Math.round((ctaClicks / views) * 100) : 0;

        setStats({
          views,
          ctaClicks,
          dismissals,
          conversionRate,
          recentEvents: events.slice(0, 10),
        });
      } catch (error) {
        console.error("Error fetching popup analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { label: "Popup Views", value: stats.views, icon: Eye, color: "text-primary" },
    { label: "CTA Clicks", value: stats.ctaClicks, icon: MousePointerClick, color: "text-success" },
    { label: "Dismissed", value: stats.dismissals, icon: XCircle, color: "text-destructive" },
    { label: "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Exit Popup Analytics
        </CardTitle>
        <CardDescription>Track performance of the exit-intent offer popup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
              <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {stats.recentEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Recent Events</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.recentEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-muted/30">
                  <span className="flex items-center gap-2">
                    {event.type === "view" && <Eye className="h-3.5 w-3.5 text-primary" />}
                    {event.type === "cta_click" && <MousePointerClick className="h-3.5 w-3.5 text-success" />}
                    {event.type === "dismiss" && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    <span className="capitalize">{event.type.replace("_", " ")}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">{event.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
