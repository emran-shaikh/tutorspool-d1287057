import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, MousePointerClick, Eye, UserMinus, TrendingUp, RefreshCw } from "lucide-react";

type EventType = "sent" | "open" | "click" | "unsubscribe";
type Role = "student" | "tutor" | "parent" | null;

interface EmailEvent {
  id: string;
  trackingId: string | null;
  userId: string | null;
  role: Role;
  kind: string | null;
  event: EventType;
  at: string;
}

interface SentLog {
  id: string;          // doc id == trackingId
  userId: string | null;
  role: Role;
  kind: string | null;
  sentAt: string;
}

interface RowAgg {
  key: string;
  kind: string;
  role: string;
  sent: number;
  opens: number;
  clicks: number;
  unsubs: number;
  uniqueOpens: Set<string>;
  uniqueClicks: Set<string>;
}

export default function EmailAnalytics() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [sentLogs, setSentLogs] = useState<SentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull both collections in parallel. emailLog is the source of truth for "sent".
      const [evSnap, logSnap] = await Promise.all([
        getDocs(query(collection(db, "emailEvents"), orderBy("at", "desc"), limit(3000))),
        getDocs(query(collection(db, "emailLog"), orderBy("sentAt", "desc"), limit(3000))),
      ]);

      setEvents(evSnap.docs.map((d) => {
        const x = d.data() as Partial<EmailEvent>;
        return {
          id: d.id,
          trackingId: (x.trackingId as string) ?? null,
          userId: (x.userId as string) ?? null,
          role: (x.role as Role) ?? null,
          kind: (x.kind as string) ?? null,
          event: (x.event as EventType) ?? "sent",
          at: (x.at as string) ?? "",
        };
      }));

      setSentLogs(logSnap.docs.map((d) => {
        const x = d.data() as Partial<SentLog>;
        return {
          id: d.id,
          userId: (x.userId as string) ?? null,
          role: (x.role as Role) ?? null,
          kind: (x.kind as string) ?? null,
          sentAt: (x.sentAt as string) ?? "",
        };
      }));
    } catch (err: any) {
      console.error("[EmailAnalytics] load failed", err);
      setError(err?.message || "Failed to load analytics. Make sure Firestore rules allow admin reads on emailEvents and emailLog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const sent = sentLogs.length;
    let opens = 0, clicks = 0, unsubs = 0;
    const uOpen = new Set<string>(), uClick = new Set<string>();
    for (const e of events) {
      if (e.event === "open") { opens++; if (e.trackingId) uOpen.add(e.trackingId); }
      else if (e.event === "click") { clicks++; if (e.trackingId) uClick.add(e.trackingId); }
      else if (e.event === "unsubscribe") unsubs++;
    }
    const openRate = sent ? Math.round((uOpen.size / sent) * 100) : 0;
    const clickRate = sent ? Math.round((uClick.size / sent) * 100) : 0;
    return { sent, opens, clicks, unsubs, uniqueOpens: uOpen.size, uniqueClicks: uClick.size, openRate, clickRate };
  }, [events, sentLogs]);

  const rows = useMemo<RowAgg[]>(() => {
    const map = new Map<string, RowAgg>();
    const keyOf = (kind: string | null, role: Role) => `${kind || "(unknown)"}__${role || "(none)"}`;
    const ensure = (kind: string | null, role: Role): RowAgg => {
      const key = keyOf(kind, role);
      let r = map.get(key);
      if (!r) {
        r = { key, kind: kind || "(unknown)", role: role || "(none)", sent: 0, opens: 0, clicks: 0, unsubs: 0, uniqueOpens: new Set(), uniqueClicks: new Set() };
        map.set(key, r);
      }
      return r;
    };
    for (const s of sentLogs) ensure(s.kind, s.role).sent++;
    for (const e of events) {
      const r = ensure(e.kind, e.role);
      if (e.event === "open") { r.opens++; if (e.trackingId) r.uniqueOpens.add(e.trackingId); }
      else if (e.event === "click") { r.clicks++; if (e.trackingId) r.uniqueClicks.add(e.trackingId); }
      else if (e.event === "unsubscribe") r.unsubs++;
    }
    return Array.from(map.values()).sort((a, b) => b.sent - a.sent);
  }, [events, sentLogs]);

  const recent = useMemo(() => {
    const merged: { id: string; event: string; kind: string | null; role: Role; at: string }[] = [
      ...sentLogs.map((s) => ({ id: `s_${s.id}`, event: "sent", kind: s.kind, role: s.role, at: s.sentAt })),
      ...events.map((e) => ({ id: e.id, event: e.event, kind: e.kind, role: e.role, at: e.at })),
    ];
    return merged.sort((a, b) => (b.at || "").localeCompare(a.at || "")).slice(0, 25);
  }, [events, sentLogs]);

  const stats = [
    { label: "Emails Sent", value: totals.sent, icon: Mail, color: "text-primary" },
    { label: `Unique Opens (${totals.openRate}%)`, value: totals.uniqueOpens, icon: Eye, color: "text-success" },
    { label: `Unique Clicks (${totals.clickRate}%)`, value: totals.uniqueClicks, icon: MousePointerClick, color: "text-warning" },
    { label: "Unsubscribes", value: totals.unsubs, icon: UserMinus, color: "text-destructive" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Email Analytics</h1>
            <p className="text-muted-foreground">Opens, clicks, conversions & unsubscribes for lifecycle emails.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Per Email Type × Role
          </CardTitle>
          <CardDescription>
            Sent comes from emailLog (every send creates one). Opens/clicks/unsubs are tracked via the pixel & redirect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No emails sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Opens</TableHead>
                    <TableHead className="text-right">Open %</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Click %</TableHead>
                    <TableHead className="text-right">CTOR</TableHead>
                    <TableHead className="text-right">Unsub</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const openPct = r.sent ? Math.round((r.uniqueOpens.size / r.sent) * 100) : 0;
                    const clickPct = r.sent ? Math.round((r.uniqueClicks.size / r.sent) * 100) : 0;
                    const ctor = r.uniqueOpens.size ? Math.round((r.uniqueClicks.size / r.uniqueOpens.size) * 100) : 0;
                    return (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium">{r.kind}</TableCell>
                        <TableCell className="capitalize">{r.role}</TableCell>
                        <TableCell className="text-right">{r.sent}</TableCell>
                        <TableCell className="text-right">{r.uniqueOpens.size}</TableCell>
                        <TableCell className="text-right">{openPct}%</TableCell>
                        <TableCell className="text-right">{r.uniqueClicks.size}</TableCell>
                        <TableCell className="text-right">{clickPct}%</TableCell>
                        <TableCell className="text-right">{ctor}%</TableCell>
                        <TableCell className="text-right">{r.unsubs}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Last 25 sends & tracked events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
            )}
            {recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/30">
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    e.event === "open" ? "bg-success/10 text-success" :
                    e.event === "click" ? "bg-warning/10 text-warning" :
                    e.event === "unsubscribe" ? "bg-destructive/10 text-destructive" :
                    "bg-primary/10 text-primary"
                  }`}>{e.event}</span>
                  <span className="font-medium">{e.kind}</span>
                  <span className="text-muted-foreground text-xs capitalize">{e.role}</span>
                </span>
                <span className="text-muted-foreground text-xs">{e.at ? new Date(e.at).toLocaleString() : ""}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
