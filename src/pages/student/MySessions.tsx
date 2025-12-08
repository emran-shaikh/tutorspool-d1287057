import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Video, Clock, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getStudentSessions, Session } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<Session['status'], string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-muted text-muted-foreground border-muted"
};

export default function MySessions() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userProfile?.uid) return;
      const data = await getStudentSessions(userProfile.uid);
      setSessions(data);
      setLoading(false);
    };
    fetchSessions();
  }, [userProfile]);

  const upcomingSessions = sessions.filter(s => s.status === 'accepted');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const pastSessions = sessions.filter(s => ['completed', 'declined', 'cancelled'].includes(s.status));

  const SessionCard = ({ session }: { session: Session }) => (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{session.subject}</p>
          <p className="text-sm text-muted-foreground">{session.tutorName}</p>
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
      {session.status === 'accepted' && session.zoomLink && (
        <Button size="sm" className="w-full" asChild>
          <a href={session.zoomLink} target="_blank" rel="noopener noreferrer">
            <Video className="h-4 w-4 mr-2" /> Join Session
            <ExternalLink className="h-3 w-3 ml-2" />
          </a>
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <Link to="/student/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">My Sessions</h1>
        <p className="text-muted-foreground">View and manage your tutoring sessions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Sessions ready to join</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming sessions. <Link to="/student/tutors" className="text-primary hover:underline">Book one now!</Link>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Requests
                </CardTitle>
                <CardDescription>Waiting for tutor confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Past Sessions
                </CardTitle>
                <CardDescription>Your session history</CardDescription>
              </CardHeader>
              <CardContent>
                {pastSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No past sessions</p>
                ) : (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
