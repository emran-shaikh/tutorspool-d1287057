import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Eye, Clock, TrendingDown, Download, Calendar, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VisitorSession {
  id: string;
  sessionId: string;
  date: string;
  hour: number;
  landingPage: string;
  exitPage: string;
  referrer: string;
  referrerCategory: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  device: string;
  os: string;
  browser: string;
  language?: string;
  pageViews: number;
  durationSec: number;
  bounced: boolean;
  startedAt?: any;
}

function formatDuration(sec: number) {
  if (!sec || sec < 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function todayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

export default function VisitorAnalytics() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "7d" | "30d">("today");

  useEffect(() => {
    fetchSessions();
  }, [range]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
      const since = todayKey(days - 1);
      const q = query(
        collection(db, "visitorSessions"),
        where("date", ">=", since),
        orderBy("date", "desc"),
        limit(2000),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as VisitorSession[];
      setSessions(data);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to load analytics",
        description: e?.message || "Check Firestore rules for visitorSessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = sessions.length;
    const totalPV = sessions.reduce((a, s) => a + (s.pageViews || 0), 0);
    const avgDur = total ? Math.round(sessions.reduce((a, s) => a + (s.durationSec || 0), 0) / total) : 0;
    const bounces = sessions.filter((s) => s.bounced || (s.pageViews || 0) <= 1).length;
    const bounceRate = total ? Math.round((bounces / total) * 100) : 0;
    return { total, totalPV, avgDur, bounceRate, bounces };
  }, [sessions]);

  const groupBy = (key: keyof VisitorSession | "utmCampaign") => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const v = ((s as any)[key] || "(none)") as string;
      map.set(v, (map.get(v) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  const sources = useMemo(() => groupBy("referrerCategory"), [sessions]);
  const utmCampaigns = useMemo(() => groupBy("utmCampaign"), [sessions]);
  const utmSources = useMemo(() => groupBy("utmSource"), [sessions]);
  const devices = useMemo(() => groupBy("device"), [sessions]);
  const browsers = useMemo(() => groupBy("browser"), [sessions]);
  const oses = useMemo(() => groupBy("os"), [sessions]);
  const landingPages = useMemo(() => groupBy("landingPage"), [sessions]);
  const exitPages = useMemo(() => {
    // exit pages where users left — group with bounce/short duration weight
    const map = new Map<string, { count: number; avgDur: number; bounces: number }>();
    sessions.forEach((s) => {
      const k = s.exitPage || "(unknown)";
      const cur = map.get(k) || { count: 0, avgDur: 0, bounces: 0 };
      cur.count += 1;
      cur.avgDur += s.durationSec || 0;
      if (s.bounced || (s.pageViews || 0) <= 1) cur.bounces += 1;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ page: k, count: v.count, avgDur: Math.round(v.avgDur / v.count), bounceRate: Math.round((v.bounces / v.count) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  const hourly = useMemo(() => {
    const arr = new Array(24).fill(0);
    sessions.forEach((s) => {
      const h = typeof s.hour === "number" ? s.hour : 0;
      arr[h] += 1;
    });
    return arr;
  }, [sessions]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => map.set(s.date, (map.get(s.date) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sessions]);

  const downloadCSV = () => {
    if (sessions.length === 0) {
      toast({ title: "No data to export" });
      return;
    }
    const headers = [
      "date", "hour", "landingPage", "exitPage", "pageViews", "durationSec", "bounced",
      "referrer", "referrerCategory", "utmSource", "utmMedium", "utmCampaign",
      "device", "os", "browser", "language",
    ];
    const rows = sessions.map((s) => headers.map((h) => JSON.stringify((s as any)[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor_analytics_${range}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded" });
  };

  const renderBarList = (items: [string, number][], max = 10) => {
    const top = items.slice(0, max);
    const maxVal = Math.max(1, ...top.map(([, v]) => v));
    return (
      <div className="space-y-2">
        {top.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
        {top.map(([k, v]) => (
          <div key={k} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate max-w-[70%]" title={k}>{k}</span>
              <span className="font-medium">{v}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(v / maxVal) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Visitor Analytics</h1>
            <p className="text-muted-foreground">Daily traffic, sources, time spent, exit pages & marketing performance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={range === "today" ? "default" : "outline"} size="sm" onClick={() => setRange("today")}>Today</Button>
            <Button variant={range === "7d" ? "default" : "outline"} size="sm" onClick={() => setRange("7d")}>7 days</Button>
            <Button variant={range === "30d" ? "default" : "outline"} size="sm" onClick={() => setRange("30d")}>30 days</Button>
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Sessions", value: stats.total, icon: Users, color: "text-primary" },
              { label: "Page Views", value: stats.totalPV, icon: Eye, color: "text-success" },
              { label: "Avg. Time", value: formatDuration(stats.avgDur), icon: Clock, color: "text-warning" },
              { label: "Bounce Rate", value: `${stats.bounceRate}%`, icon: TrendingDown, color: "text-destructive" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                    <s.icon className={`h-7 w-7 ${s.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="sources" className="mb-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
              <TabsTrigger value="marketing">Marketing (UTM)</TabsTrigger>
              <TabsTrigger value="behavior">Pages & Exits</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="time">Time Patterns</TabsTrigger>
              <TabsTrigger value="raw">Raw Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="grid md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Where they came from</CardTitle>
                  <CardDescription>Direct, search, social, referral, internal</CardDescription>
                </CardHeader>
                <CardContent>{renderBarList(sources)}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                  <CardDescription>Specific referring URLs</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderBarList(
                    Array.from(
                      sessions.reduce((m, s) => {
                        const k = s.referrer || "(direct)";
                        m.set(k, (m.get(k) || 0) + 1);
                        return m;
                      }, new Map<string, number>()),
                    ).sort((a, b) => b[1] - a[1]),
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="grid md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader><CardTitle>UTM Campaigns</CardTitle><CardDescription>?utm_campaign=</CardDescription></CardHeader>
                <CardContent>{renderBarList(utmCampaigns)}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>UTM Sources</CardTitle><CardDescription>?utm_source=</CardDescription></CardHeader>
                <CardContent>{renderBarList(utmSources)}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>UTM Mediums</CardTitle><CardDescription>?utm_medium=</CardDescription></CardHeader>
                <CardContent>{renderBarList(groupBy("utmMedium" as any))}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="grid md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Landing Pages</CardTitle>
                  <CardDescription>First page visitors saw</CardDescription>
                </CardHeader>
                <CardContent>{renderBarList(landingPages)}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Where they left</CardTitle>
                  <CardDescription>Exit pages with avg time & bounce rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exit Page</TableHead>
                          <TableHead className="text-right">Exits</TableHead>
                          <TableHead className="text-right">Avg Time</TableHead>
                          <TableHead className="text-right">Bounce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exitPages.slice(0, 20).map((p) => (
                          <TableRow key={p.page}>
                            <TableCell className="max-w-[200px] truncate" title={p.page}>{p.page}</TableCell>
                            <TableCell className="text-right">{p.count}</TableCell>
                            <TableCell className="text-right">{formatDuration(p.avgDur)}</TableCell>
                            <TableCell className="text-right">{p.bounceRate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="grid md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Devices</CardTitle></CardHeader>
                <CardContent>{renderBarList(devices)}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Browsers</CardTitle></CardHeader>
                <CardContent>{renderBarList(browsers)}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Operating Systems</CardTitle></CardHeader>
                <CardContent>{renderBarList(oses)}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time" className="grid md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Hourly Distribution</CardTitle>
                  <CardDescription>Sessions by hour of day (0-23)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-40">
                    {hourly.map((v, i) => {
                      const max = Math.max(1, ...hourly);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(v / max) * 100}%` }} title={`${i}:00 — ${v}`} />
                          <span className="text-[10px] text-muted-foreground">{i}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Daily Sessions</CardTitle>
                  <CardDescription>Sessions per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {daily.map(([d, v]) => {
                      const max = Math.max(1, ...daily.map(([, x]) => x));
                      return (
                        <div key={d}>
                          <div className="flex justify-between text-sm">
                            <span>{d}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(v / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>Last {Math.min(100, sessions.length)} sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Landing</TableHead>
                          <TableHead>Exit</TableHead>
                          <TableHead className="text-right">PV</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>UTM</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.slice(0, 100).map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-xs">{s.date} {String(s.hour).padStart(2, "0")}h</TableCell>
                            <TableCell className="text-xs capitalize">{s.referrerCategory}</TableCell>
                            <TableCell className="text-xs max-w-[140px] truncate" title={s.landingPage}>{s.landingPage}</TableCell>
                            <TableCell className="text-xs max-w-[140px] truncate" title={s.exitPage}>{s.exitPage}</TableCell>
                            <TableCell className="text-right text-xs">{s.pageViews}</TableCell>
                            <TableCell className="text-right text-xs">{formatDuration(s.durationSec)}</TableCell>
                            <TableCell className="text-xs">{s.device}/{s.browser}</TableCell>
                            <TableCell className="text-xs">{s.utmCampaign || s.utmSource || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
}
