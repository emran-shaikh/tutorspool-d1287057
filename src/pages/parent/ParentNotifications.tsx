import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getParentNotifications,
  markParentNotificationRead,
  markAllParentNotificationsRead,
  type ParentNotification,
} from "@/lib/firestore";
import { Bell, BookOpen, Calendar, Trophy, CheckCircle2, ArrowLeft, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TYPE_META: Record<ParentNotification["type"], { icon: typeof Bell; label: string; tone: string }> = {
  quiz_completed: { icon: BookOpen, label: "Quiz", tone: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  session_booked: { icon: Calendar, label: "Session Booked", tone: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  session_status: { icon: Calendar, label: "Session Update", tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  milestone:      { icon: Trophy,   label: "Milestone", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

export default function ParentNotifications() {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<ParentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ParentNotification["type"]>("all");

  const load = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const data = await getParentNotifications(userProfile.uid);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userProfile?.uid]);

  const handleMarkRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await markParentNotificationRead(id);
  };

  const handleMarkAll = async () => {
    if (!userProfile?.uid) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await markAllParentNotificationsRead(userProfile.uid);
  };

  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);
  const unreadCount = items.filter(i => !i.read).length;

  const filters: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "quiz_completed", label: "Quizzes" },
    { value: "session_booked", label: "Sessions" },
    { value: "session_status", label: "Updates" },
    { value: "milestone", label: "Milestones" },
  ];

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/parent/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              Notifications
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
            </h1>
            <p className="text-muted-foreground">All activity from your linked children</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "You'll see updates here when your child completes quizzes, books sessions, or hits milestones."
                  : "No notifications match this filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => {
              const meta = TYPE_META[n.type];
              const Icon = meta.icon;
              return (
                <Card key={n.id} className={!n.read ? "border-primary/40 bg-primary/[0.02]" : ""}>
                  <CardHeader className="flex flex-row items-start gap-3 pb-3">
                    <div className={`p-2 rounded-md border ${meta.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{n.title}</CardTitle>
                        {!n.read && <Badge variant="secondary" className="text-xs">New</Badge>}
                        <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.childName} ·{" "}
                        {n.createdAtIso
                          ? formatDistanceToNow(new Date(n.createdAtIso), { addSuffix: true })
                          : "just now"}
                      </p>
                    </div>
                    {!n.read && n.id && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id!)}>
                        Mark read
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 pl-[60px]">
                    <p className="text-sm text-foreground">{n.message}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
