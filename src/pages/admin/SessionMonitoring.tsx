import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Calendar, Clock, User } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllSessions, Session } from "@/lib/firestore";

const statusColors: Record<Session['status'], string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-muted text-muted-foreground border-muted"
};

export default function SessionMonitoring() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const data = await getAllSessions();
      setSessions(data);
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'accepted');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const stats = [
    { label: "Active Sessions", value: activeSessions.length, color: "text-success" },
    { label: "Pending Requests", value: pendingSessions.length, color: "text-warning" },
    { label: "Completed Today", value: completedSessions.filter(s => {
      const today = new Date().toISOString().split('T')[0];
      return s.date === today;
    }).length, color: "text-primary" },
    { label: "Total Sessions", value: sessions.length, color: "text-muted-foreground" }
  ];

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Session Monitoring</h1>
        <p className="text-muted-foreground">View and monitor all platform sessions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              All Sessions
            </CardTitle>
            <CardDescription>Complete session history</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sessions yet</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {session.studentName}
                          </span>
                          <span>with</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {session.tutorName}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[session.status]}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {session.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
