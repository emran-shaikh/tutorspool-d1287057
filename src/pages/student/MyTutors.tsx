import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ClipboardList, BookOpen, ExternalLink, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getConnectionsForStudent,
  getAssignmentsForStudent,
  updateTutorAssignmentStatus,
  StudentTutorConnection,
  TutorAssignment,
} from "@/lib/firestore";

export default function MyTutors() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<StudentTutorConnection[]>([]);
  const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (userProfile?.uid) fetchAll(); }, [userProfile]);

  const fetchAll = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const [conns, asgs] = await Promise.all([
        getConnectionsForStudent(userProfile.uid),
        getAssignmentsForStudent(userProfile.uid),
      ]);
      setConnections(conns);
      setAssignments(asgs);
    } catch {
      toast({ title: "Could not load your tutors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      await updateTutorAssignmentStatus(id, "completed");
      toast({ title: "Marked complete" });
      fetchAll();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const activeConns = connections.filter(c => c.status === "active");

  if (loading) {
    return <DashboardLayout role="student"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-blue-600" /> My Tutors
        </h1>
        <p className="text-muted-foreground">Tutors connected to you by an admin and the work they've assigned.</p>
      </div>

      {activeConns.length === 0 ? (
        <Card className="border-blue-200">
          <CardContent className="py-10 text-center text-muted-foreground">
            No active tutor connections yet. Ask an admin to connect you with a tutor.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeConns.map(c => {
            const items = assignments.filter(a => a.tutorId === c.tutorId);
            return (
              <Card key={c.id} className="border-blue-100">
                <CardHeader>
                  <CardTitle>{c.tutorName}</CardTitle>
                  <CardDescription>Subjects: {c.subjects.join(", ") || "—"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">Nothing assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(a => (
                        <div key={a.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="capitalize">
                                {a.type === "task" && <ClipboardList className="h-3 w-3 mr-1" />}
                                {a.type === "resource" && <BookOpen className="h-3 w-3 mr-1" />}
                                {a.type}
                              </Badge>
                              <p className="font-medium">{a.title}</p>
                              <Badge variant={a.status === "completed" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
                            </div>
                            {a.dueDate && <span className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                          </div>
                          {a.description && <p className="text-sm text-muted-foreground mb-2">{a.description}</p>}
                          <div className="flex flex-wrap gap-2">
                            {a.payload?.resourceUrl && (
                              <Button asChild size="sm" variant="outline">
                                <a href={a.payload.resourceUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" /> Open resource
                                </a>
                              </Button>
                            )}
                            {a.type === "quiz" && a.payload?.quizId && (
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/student/quiz/${a.payload.quizId}`}>Take quiz</Link>
                              </Button>
                            )}
                            {a.status !== "completed" && (
                              <Button size="sm" onClick={() => markComplete(a.id!)} className="bg-blue-600 hover:bg-blue-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Mark complete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
