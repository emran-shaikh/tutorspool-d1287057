import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, CalendarDays, ClipboardList, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignmentsForStudent, TutorAssignment } from "@/lib/firestore";
import {
  getSubscriptionsForStudent,
  getSessionsForPackage,
  GroupSession,
  GroupSubscription,
} from "@/lib/groupClasses";
import { roomIdForGroupSession } from "@/lib/classroom";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-blue-100 text-blue-800",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyGroupClasses() {
  const { userProfile } = useAuth();
  const [subs, setSubs] = useState<GroupSubscription[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    (async () => {
      setLoading(true);
      const [mySubs, myAssignments] = await Promise.all([
        getSubscriptionsForStudent(userProfile.uid),
        getAssignmentsForStudent(userProfile.uid),
      ]);
      setSubs(mySubs);
      setAssignments(myAssignments.filter(a => !!a.groupPackageId));

      const active = mySubs.filter(s => s.status === "active");
      const sessionLists = await Promise.all(active.map(s => getSessionsForPackage(s.packageId)));
      setSessions(
        sessionLists
          .flat()
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      );
      setLoading(false);
    })();
  }, [userProfile?.uid]);

  const upcoming = sessions.filter(s => new Date(s.scheduledAt).getTime() > Date.now() - 60 * 60 * 1000);

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" /> My Group Classes
          </h1>
          <p className="text-muted-foreground">
            Your group subscriptions, upcoming live sessions and work assigned to your batch.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/group-classes">
            Browse group classes <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {subs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">You haven't joined a group class yet.</p>
            <Button asChild>
              <Link to="/group-classes">Explore group classes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Payment is confirmed by our team before a seat goes active.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {subs.map(s => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/group-classes/${s.packageId}`}
                      className="font-medium hover:text-primary"
                    >
                      {s.packageTitle}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      with {s.tutorName || "your tutor"}
                      {s.paidThrough && s.status === "active"
                        ? ` · active until ${new Date(s.paidThrough).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Badge className={`${statusStyles[s.status]} border-0 capitalize`}>{s.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" /> Upcoming sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No upcoming sessions scheduled yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(s => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{s.topic}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm">
                          <Link to={`/classroom/${roomIdForGroupSession(s.id!)}`}>
                            <Video className="h-4 w-4 mr-2" /> Join Classroom
                          </Link>
                        </Button>
                        {s.zoomJoinUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={s.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                              Zoom
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" /> Group work
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nothing assigned to your group yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <div key={a.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">{a.type}</Badge>
                        <p className="font-medium">{a.title}</p>
                        <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                      </div>
                      {a.description && (
                        <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                      )}
                      {a.payload?.resourceUrl && (
                        <a
                          href={a.payload.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline break-all"
                        >
                          {a.payload.resourceUrl}
                        </a>
                      )}
                      {a.type === "quiz" && a.payload?.quizId && (
                        <Button asChild size="sm" variant="outline" className="mt-2">
                          <Link to={`/student/quiz/${a.payload.quizId}`}>Start quiz</Link>
                        </Button>
                      )}
                      {a.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due {new Date(a.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
